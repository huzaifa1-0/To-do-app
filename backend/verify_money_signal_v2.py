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

def verify_signal():
    print("Starting verification of Money Assignment Notification signal...")
    
    # Clean up any existing test user
    test_email = "realtestuser@example.com"
    User.objects.filter(email=test_email).delete()
    
    # Create a test user
    user = User.objects.create_user(
        email=test_email,
        password="testpassword123",
        first_name="RealTest",
        last_name="User"
    )
    print(f"Created test user: {user.email}")
    
    # Clear outbox
    mail.outbox = []
    
    # 1. Update assigned_amount (new assignment)
    print("Assigning Rs. 5000 to user...")
    user.assigned_amount = Decimal('5000.00')
    user.save()
    
    if len(mail.outbox) == 1:
        print("SUCCESS: Notification email sent for new assignment.")
        print(f"From: {mail.outbox[0].from_email}")
        print(f"Expected From: {settings.DEFAULT_FROM_EMAIL}")
    else:
        print(f"FAILURE: Expected 1 email, found {len(mail.outbox)}.")
        if len(mail.outbox) > 0:
             print(f"Subject found: {mail.outbox[0].subject}")
    
    # Cleanup
    User.objects.filter(email=test_email).delete()
    print("Verification complete.")

if __name__ == "__main__":
    verify_signal()
