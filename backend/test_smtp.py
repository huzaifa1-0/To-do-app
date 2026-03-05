import os
import django
from django.core.mail import send_mail
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

def test_real_email():
    recipient = settings.EMAIL_HOST_USER
    print(f"Attempting to send a test email to {recipient} using {settings.EMAIL_HOST}...")
    try:
        send_mail(
            "SMTP Test Email",
            "This is a test email to verify SMTP configuration.",
            settings.DEFAULT_FROM_EMAIL,
            [recipient],
            fail_silently=False,
        )
        print("SUCCESS: Email sent successfully!")
    except Exception as e:
        print(f"FAILURE: Could not send email. Error: {e}")

if __name__ == "__main__":
    test_real_email()
