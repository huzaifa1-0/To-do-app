from expenses.models import Expense
from django.utils import timezone
from datetime import timedelta

print("=== Debugging Expense API Issues ===")

# Check total count
total_count = Expense.objects.count()
print(f"Total expenses in database: {total_count}")

# Check a sample expense
sample = Expense.objects.first()
if sample:
    print(f"Sample expense: {sample}")
    print(f"Sample date_field: {sample.date_field}")
    print(f"Sample date_field type: {type(sample.date_field)}")

# Test different date queries
today = timezone.now().date()
print(f"\nToday's date: {today}")

try:
    # Try simple filter first
    all_expenses = Expense.objects.all()
    print(f"All expenses count: {all_expenses.count()}")
    
    # Try filtering by date_field__date
    today_expenses = Expense.objects.filter(date_field__date=today)
    print(f"Today expenses (date_field__date): {today_expenses.count()}")
    
    # Try filtering by date_field__range for week
    week_start = today - timedelta(days=today.weekday())
    week_expenses = Expense.objects.filter(date_field__range=[week_start, today])
    print(f"Week expenses (date_field__range): {week_expenses.count()}")
    
    # Try filtering by month
    month_expenses = Expense.objects.filter(date_field__month=today.month, date_field__year=today.year)
    print(f"Month expenses (date_field__month): {month_expenses.count()}")
    
except Exception as e:
    print(f"Error occurred: {e}")
    import traceback
    traceback.print_exc()