import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.conf import settings
print(f"Using database: {settings.DATABASES['default']['NAME']}")

from expenses.models import Category

categories = [
    'Food', 'Travel', 'Transportation', 'Shopping', 
    'Entertainment', 'Healthcare', 'Utilities', 'Miscellaneous'
]

for cat_name in categories:
    obj, created = Category.objects.get_or_create(name=cat_name)
    if created:
        print(f"Created category: {cat_name}")
    else:
        print(f"Category already exists: {cat_name}")

print("Category population complete.")
