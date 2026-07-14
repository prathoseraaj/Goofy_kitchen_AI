import os
import json
import time
from langchain_core.documents import Document
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv

# Load key from environment variables
load_dotenv()
google_api_key = os.getenv("GEMINI_API_KEY")

# Dynamic Absolute Path Finding
# This accurately calculates the path relative to the file itself, avoiding terminal folder errors
current_dir = os.path.dirname(os.path.abspath(__file__))
recipe_path = os.path.abspath(os.path.join(current_dir, "../data/recipe.json"))

print(f"Attempting to load data from: {recipe_path}")

# Load and slice data
with open(recipe_path, "r") as f:
    all_recipes = json.load(f)
recipes_data = all_recipes[:500] 

# Format documents
cooking_docs = []
for recipe in recipes_data:
    ingredients_str = ", ".join(recipe["ingredients"])
    cuisine = recipe["cuisine"]
    page_content = f"A recipe belonging to {cuisine} cuisine contains these ingredients: {ingredients_str}."
    doc = Document(page_content=page_content, metadata={"cuisine": cuisine, "id": recipe["id"]})
    cooking_docs.append(doc)

# Setup embedding model
embeddings = GoogleGenerativeAIEmbeddings(
    model="gemini-embedding-2-preview", 
    api_key=google_api_key,
)

# Build index slowly with rate-limiting pauses
print("Building database index structure...")
vector_store = None
LOOP_BATCH_SIZE = 10 

for i in range(0, len(cooking_docs), LOOP_BATCH_SIZE):
    batch = cooking_docs[i : i + LOOP_BATCH_SIZE]
    success = False
    while not success:
        try:
            if vector_store is None:
                vector_store = FAISS.from_documents(batch, embeddings)
            else:
                vector_store.add_documents(batch)
            success = True
            print(f"Ingested items {i} to {i + len(batch)}")
        except Exception as e:
            print("Rate limit boundary hit. Sleeping for 20 seconds...")
            time.sleep(20)
    time.sleep(4)

# Save data to a local folder inside the backend directory
output_db_path = os.path.join(current_dir, "faiss_kitchen_index")
vector_store.save_local(output_db_path)
print("\n--- DONE ---")
print(f"Database index saved successfully to: {output_db_path}")