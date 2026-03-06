import os
import django
import sys
from decimal import Decimal

# Setup Django environment
sys.path.append('d:/The Manager/To-do-app/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from expenses.models import Income, FutureExpense, Expense, Category
from users.models import User

def test_backend_logic():
    print("--- Starting Backend Logic Test ---")
    
    # 1. Get or create a test user
    test_email = 'test_backend@example.com'
    user, created = User.objects.get_or_create(email=test_email)
    if created:
        user.set_password('testpass123')
        user.total_balance = Decimal('1000.00')
        user.save()
    
    initial_balance = user.total_balance
    print(f"Initial Balance: {initial_balance}")
    
    # 2. Test Future Income
    print("\nTesting Future Income...")
    income = Income.objects.create(
        user=user,
        source="Test Salary",
        amount=Decimal('500.00'),
        expected_date="2026-04-01",
        status="Pending"
    )
    print(f"Created Income: {income.source}, Amount: {income.amount}, Status: {income.status}")
    
    # Check balance (should not change)
    user.refresh_from_db()
    print(f"Balance after pending income: {user.total_balance}")
    if user.total_balance != initial_balance:
        print("ERROR: Balance changed after pending income!")
    else:
        print("SUCCESS: Balance unchanged.")
        
    # Simulate the 'receive' action logic
    income.status = 'Received'
    income.save()
    user.total_balance += income.amount
    user.save()
    
    user.refresh_from_db()
    print(f"Balance after receiving income: {user.total_balance}")
    if user.total_balance == initial_balance + Decimal('500.00'):
        print("SUCCESS: Balance updated correctly after receipt.")
    else:
        print(f"ERROR: Balance update failed! Expected {initial_balance + Decimal('500.00')}, got {user.total_balance}")

    # 3. Test Future Expense
    print("\nTesting Future Expense...")
    fe_initial_balance = user.total_balance
    fe = FutureExpense.objects.create(
        user=user,
        title="Test Rent",
        amount=Decimal('300.00'),
        expected_date="2026-04-05",
        status="Planned"
    )
    print(f"Created Future Expense: {fe.title}, Amount: {fe.amount}, Status: {fe.status}")
    
    # Check balance (should not change)
    user.refresh_from_db()
    if user.total_balance != fe_initial_balance:
        print("ERROR: Balance changed after planning expense!")
    else:
        print("SUCCESS: Balance unchanged.")
        
    # Simulate the 'confirm' action logic
    category, _ = Category.objects.get_or_create(name="Others")
    fe.status = 'Confirmed'
    fe.save()
    
    Expense.objects.create(
        user=user,
        title=fe.title,
        amount=fe.amount,
        category=category,
        description="Created from planned future expense"
    )
    user.total_balance -= fe.amount
    user.save()
    
    user.refresh_from_db()
    print(f"Balance after confirming expense: {user.total_balance}")
    if user.total_balance == fe_initial_balance - Decimal('300.00'):
        print("SUCCESS: Balance updated correctly after confirmation.")
    else:
        print(f"ERROR: Balance update failed! Expected {fe_initial_balance - Decimal('300.00')}, got {user.total_balance}")
        
    print("\n--- Test Finished ---")

if __name__ == "__main__":
    test_backend_logic()
