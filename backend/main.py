import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv

load_dotenv()
google_api_key = os.getenv("GEMINI_API_KEY")

conversational_rag_chain = None

chat_histories = {}

def get_session_history(session_id: str):
    if session_id not in chat_histories:
        chat_histories[session_id] = InMemoryChatMessageHistory()
    return chat_histories[session_id]

@asynccontextmanager
async def lifespan(app: FastAPI):
    global rag_chain
    print("FastAPI is starting up... Loading permanent FAISS index from disk...")
    
    current_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(current_dir, "faiss_kitchen_index")
    
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"Could not find local FAISS database directory at: {db_path}")

    embeddings = GoogleGenerativeAIEmbeddings(
        model="gemini-embedding-2-preview", 
        api_key=google_api_key,
    )
    
    vector_store = FAISS.load_local(
        db_path, 
        embeddings, 
        allow_dangerous_deserialization=True 
    )
    
    retriever = vector_store.as_retriever(search_kwargs={"k": 1})

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        api_key=google_api_key,
        temperature=0.8,
    )

    rag_prompt = ChatPromptTemplate.from_messages([
        ("system", (
            "You are an AI-powered Smart Fridge. You only know about kitchens, food, and cooking.\n\n"
            "Here is the verified kitchen context: {context}\n\n"
            "CRITICAL RULE: If the user's input is NOT about food, ingredients, recipes, or kitchen items, "
            "DO NOT answer their question. Instead, severely roast them for asking a fridge a non-kitchen question.\n\n"
            "If it IS about food, judge their sad ingredient list, mention what cuisine they are failing to imitate based on the context, "
            "and invent a pathetic recipe name."
        )),
        MessagesPlaceholder(variable_name="chat_history"),
        ("user", "Here is my input: {ingredients}")
    ])

    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)

    rag_chain = (
        {
            "context": RunnableLambda(lambda x: x["ingredients"]) | retriever | format_docs, 
            "ingredients": RunnablePassthrough()
        }
        | rag_prompt
        | llm
        | StrOutputParser()
    )
    conversational_rag_chain = RunnableWithMessageHistory(
        rag_chain,
        get_session_history,
        input_messages_key="ingredients",
        history_messages_key="chat_history"
    )
    
    print("FAISS database loaded instantly and RAG Chain assembled successfully!")
    yield

app = FastAPI(title="Goofy_kitchen_AI", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    ingredients: str
    session_id: str
    
@app.post("/roast")
async def roast_ingredients(payload: ChatRequest):
    if not conversational_rag_chain:
        raise HTTPException(status_code=503, detail="Server is still initializing the database.")
    
    try:
        response_text = conversational_rag_chain.invoke(
            {"ingredients": payload.ingredients},
            config={"configurable": {"session_id": payload.session_id}}
        )
        return {"roast": response_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)