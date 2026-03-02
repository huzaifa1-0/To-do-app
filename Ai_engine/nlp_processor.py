import os
from openai import OpenAI
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

# Initialize the OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Define the exact JSON structure the AI must return
class ExtractedExpense(BaseModel):
    amount: float
    currency: str
    description: str
    category: str

def parse_expense_text(user_input: str) -> dict:
    """
    Takes a raw string and extracts structured data for the PostgreSQL database.
    """
    system_prompt = """
    You are an intelligent financial assistant for a smart To-Do and Expense tracking app. 
    Extract the expense details from the user's text.
    
    Rules:
    1. If no currency is explicitly mentioned, assume it is 'PKR'.
    2. Provide a concise, clear description of the expense.
    3. You MUST classify the expense into one of the following exact categories: 
       Food, Transport, Utilities, Entertainment, Groceries, Shopping, Health, Academic, or Other.
    """

    try:
        response = client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_input}
            ],
            response_format=ExtractedExpense,
        )
        
        # Returns a clean Python dictionary ready for Django to save
        return response.choices[0].message.parsed.model_dump()
        
    except Exception as e:
        # Returns an error dictionary if the API call fails
        return {"error": str(e)}

# --- Local Testing Block ---
# This block only runs if you execute this specific file directly
if __name__ == "__main__":
    test_string = "I paid 2500 for the database server hosting today."
    print("Testing AI parsing...")
    result = parse_expense_text(test_string)
    print(result)