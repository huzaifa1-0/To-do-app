import os
import django
from django.core import mail
from decimal import Decimal

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
from django.conf import settings
settings.EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

django.setup()

from users.models import User
from expenses.models import Category, UserCategoryBudget

def verify_category_signal():
    print("Starting verification of UserCategoryBudget Notification signal...")
    
    # 1. Setup Data
    test_email = "budgettest@example.com"
    User.objects.filter(email=test_email).delete()
    user = User.objects.create_user(email=test_email, password="password123", first_name="BudgetUser")
    
    category, _ = Category.objects.get_or_create(name="Food")
    
    # Clear outbox
    mail.outbox = []
    
    # 2. Create Budget (New Assignment)
    print("Assigning Rs. 2000 for Food...")
    budget = UserCategoryBudget.objects.create(user=user, category=category, amount=Decimal('2000.00'))
    
    if len(mail.outbox) == 1:
        print(f"SUCCESS: Email sent for new category budget.")
        print(f"Subject: {mail.outbox[0].subject}")
        print(f"Body snippet: {mail.outbox[0].body[:100]}...")
    else:
        print(f"FAILURE: Expected 1 email, found {len(mail.outbox)}.")
        if len(mail.outbox) > 0:
             print(f"Subject found: {mail.outbox[0].subject}")

    # Clear outbox
    mail.outbox = []
    
    # 3. Update Budget (Increase)
    print("Increasing Food budget to Rs. 3000...")
    budget.amount = Decimal('3000.00')
    budget.save()
    
    if len(mail.outbox) == 1:
        print(f"SUCCESS: Email sent for increased category budget.")
    else:
        print(f"FAILURE: Expected 1 email, found {len(mail.outbox)}.")

    # Cleanup
    # user.delete()
    print("Verification complete.")

if __name__ == "__main__":
    verify_category_signal()
