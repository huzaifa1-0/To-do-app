from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.db.models import Sum
from django.conf import settings
from decimal import Decimal
from .models import User

# This import might cause circular issues if not careful, 
# but it's usually safe in signals if done at the top
from expenses.models import UserCategoryBudget

@receiver(pre_save, sender=User)
def capture_old_assigned_amount(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_instance = User.objects.get(pk=instance.pk)
            instance._old_assigned_amount = old_instance.assigned_amount
        except User.DoesNotExist:
            instance._old_assigned_amount = 0
    else:
        instance._old_assigned_amount = 0

@receiver(post_save, sender=User)
def notify_user_on_money_assignment(sender, instance, created, **kwargs):
    old_amount = Decimal(str(getattr(instance, '_old_assigned_amount', 0) or 0))
    new_amount = Decimal(str(instance.assigned_amount or 0))

    if new_amount > old_amount:
        total_expenses = instance.expenses.aggregate(Total=Sum('amount'))['Total'] or 0
        current_balance = new_amount - total_expenses
        
        subject = "Admin Assigned Amount"
        message = f"""Hello {instance.first_name or 'User'},

The administrator has assigned you Rs. {new_amount}.

Your account balance has been updated accordingly.
Current Balance: Rs. {current_balance}

Regards
Daily Expense Tracker Team"""

        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [instance.email], fail_silently=False)

@receiver(pre_save, sender=UserCategoryBudget)
def capture_old_budget_amount(sender, instance, **kwargs):
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

    if new_amount > old_amount:
        user = instance.user
        category = instance.category
        
        subject = f"Budget Assigned: {category.name}"
        message = f"""Hello {user.first_name or 'User'},

The administrator has assigned you Rs. {new_amount} for the category '{category.name}'.

Your category budget has been updated accordingly.

Regards
Daily Expense Tracker Team"""

        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)
