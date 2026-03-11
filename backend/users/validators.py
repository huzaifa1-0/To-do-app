import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _

class ComprehensivePasswordValidator:
    def validate(self, password, user=None):
        if not re.search(r'[A-Z]', password):
            raise ValidationError(
                _("This password must contain at least one uppercase letter."),
                code='password_no_upper',
            )
        if not re.search(r'[a-z]', password):
            raise ValidationError(
                _("This password must contain at least one lowercase letter."),
                code='password_no_lower',
            )
        if not re.search(r'\d', password):
            raise ValidationError(
                _("This password must contain at least one numeric digit."),
                code='password_no_digit',
            )
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            raise ValidationError(
                _("This password must contain at least one special character."),
                code='password_no_special',
            )

    def get_help_text(self):
        return _(
            "Your password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character."
        )

def validate_email_strict(value):
    """
    Validate that the email is a gmail address and is strictly lowercase.
    """
    if any(char.isupper() for char in value):
        raise ValidationError(
            _("Email must be in all lowercase letters."),
            code='email_not_lowercase'
        )
        
    email_regex = r'^[a-z0-9._%+-]+@gmail\.com$'
    if not re.match(email_regex, value):
        raise ValidationError(
            _("Only Gmail addresses are allowed (e.g., name@gmail.com)."),
            code='email_invalid_domain'
        )
