import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _

class UppercaseAndSpecialCharValidator:
    def validate(self, password, user=None):
        if not re.search(r'[A-Z]', password):
            raise ValidationError(
                _("This password must contain at least one uppercase letter."),
                code='password_no_upper',
            )
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            raise ValidationError(
                _("This password must contain at least one special character."),
                code='password_no_special',
            )

    def get_help_text(self):
        return _(
            "Your password must contain at least one uppercase letter and one special character."
        )

def validate_email_strict(value):
    """
    Validate that the email has a proper domain structure: name@domain.tld
    Domain must be at least 2 characters long.
    """
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]{2,}(\.[a-zA-Z0-9-]{2,})+$'
    if not re.match(email_regex, value):
        raise ValidationError(
            _("Please enter a valid email address (e.g., name@gmail.com). Small domains like 'g.com' are not allowed."),
            code='email_invalid_format'
        )
