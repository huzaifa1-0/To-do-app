from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from decimal import Decimal
import threading
from .models import UserCategoryBudget, Expense

def send_async_email(subject, message, recipient_list):
    """Helper function to send email in a background thread."""
    def _send():
        try:
            send_mail(
                subject, 
                message, 
                settings.DEFAULT_FROM_EMAIL, 
                recipient_list, 
                fail_silently=False
            )
            with open('signal_debug.log', 'a') as f:
                f.write(f"  ASYNC SUCCESS: Email sent to {recipient_list}\n")
        except Exception as e:
            with open('signal_debug.log', 'a') as f:
                f.write(f"  ASYNC FAILURE: {e}\n")

    thread = threading.Thread(target=_send)
    thread.start()

@receiver(pre_save, sender=UserCategoryBudget)
def capture_old_budget_amount(sender, instance, **kwargs):
    with open('signal_debug.log', 'a') as f:
        f.write(f"BUDGET PRE_SAVE: {instance.id}, user: {instance.user.email}\n")
    if instance.pk:
        try:
            old_instance = UserCategoryBudget.objects.get(pk=instance.pk)
            instance._old_amount = old_instance.amount
        except UserCategoryBudget.DoesNotExist:
            instance._old_amount = 0
    else:
        instance._old_amount = 0

@receiver(post_save, sender=UserCategoryBudget)
def notify_user_on_category_budget_assignment(sender, instance, created, **kwargs):
    old_amount = Decimal(str(getattr(instance, '_old_amount', 0) or 0))
    new_amount = Decimal(str(instance.amount or 0))
    with open('signal_debug.log', 'a') as f:
        f.write(f"BUDGET POST_SAVE: user: {instance.user.email}, Old: {old_amount}, New: {new_amount}\n")

    if new_amount > old_amount:
        user = instance.user
        category = instance.category
        
        subject = f"Budget Assigned: {category.name}"
        message = f"""Hello {user.first_name or 'User'},

The administrator has assigned you Rs. {new_amount} for the category '{category.name}'.

Your category budget has been updated accordingly.

Regards
Daily Expense Tracker Team"""

        send_async_email(subject, message, [user.email])


