import os
import json
from groq import Groq
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize the Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def parse_expense_text(user_input: str, allowed_categories: list) -> dict:
    """
    Takes a raw string and extracts structured data for the PostgreSQL database using Groq.
    """
    categories_str = ", ".join(allowed_categories)
    system_prompt = f"""
    You are an intelligent financial assistant for a smart To-Do and Expense tracking app. 
    Extract the expense details from the user's text.
    
    Rules:
    1. If no currency is explicitly mentioned, assume it is 'PKR'.
    2. Provide a concise, clear description of the expense.
    3. You MUST classify the expense into EXACTLY one of these categories: 
       {categories_str}.
    4. You MUST respond in pure JSON format with the following keys exactly:
       "amount" (number), "currency" (string), "description" (string), "category" (string).
    """

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant", # Fast, free, open-source model
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_input}
            ],
            response_format={"type": "json_object"}, # Forces Groq to return valid JSON
            temperature=0.0 # Keeps the AI focused and deterministic
        )
        
        # Parse the JSON string returned by Groq into a Python dictionary
        result_dict = json.loads(response.choices[0].message.content)
        return result_dict
        
    except Exception as e:
        return {"error": str(e)}

# --- Local Testing Block ---
if __name__ == "__main__":
    test_string = "Paid 500 for a rickshaw ride to campus."
    print("Testing Groq AI parsing...")
    result = parse_expense_text(test_string)
    print(result)