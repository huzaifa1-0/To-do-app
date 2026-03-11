from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from .validators import validate_email_strict

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(validators=[validate_email_strict])
    confirm_password = serializers.CharField(write_only=True)
    current_income = serializers.DecimalField(max_digits=12, decimal_places=2, write_only=True, required=True, min_value=0)

    class Meta:
        model = User
        fields = ('id', 'first_name', 'last_name', 'email', 'password', 'confirm_password', 'current_income')
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate_first_name(self, value):
        if not value.isalpha():
            raise serializers.ValidationError("First name must contain only alphabetic characters.")
        return value

    def validate_last_name(self, value):
        if not value.isalpha():
            raise serializers.ValidationError("Last name must contain only alphabetic characters.")
        return value

    def validate(self, attrs):
        if not attrs.get('last_name'):
             raise serializers.ValidationError({"last_name": "Last name is strictly required."})
        
        email = attrs.get('email')
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "Email is already registered. Please login instead."})

        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        validate_password(attrs['password'])
        
        current_income = attrs.get('current_income')
        if current_income is not None:
            if current_income < 0:
                raise serializers.ValidationError({"current_income": "Initial income cannot be negative."})
            if str(current_income).startswith('-'):
                raise serializers.ValidationError({"current_income": "Initial income cannot be -0."})

        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        current_income = validated_data.pop('current_income', 0.00)
        
        user = User.objects.create_user(**validated_data)
        user.total_balance = current_income
        user.save(update_fields=['total_balance'])
        return user

class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'first_name', 'last_name', 'email', 'assigned_amount')

from .models import Invitation

class InvitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invitation
        fields = ('id', 'employer', 'email', 'token', 'accepted', 'created_at')
        read_only_fields = ('id', 'employer', 'token', 'accepted', 'created_at')


# --- Password Reset Serializers ---
class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

class PasswordResetVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)

    def validate(self, attrs):
        from .models import PasswordResetOTP
        from django.utils import timezone
        from datetime import timedelta
        
        email = attrs['email']
        otp_code = attrs['otp']
        
        try:
            user = User.objects.get(email=email)
            otp_record = PasswordResetOTP.objects.get(user=user)
        except (User.DoesNotExist, PasswordResetOTP.DoesNotExist):
            raise serializers.ValidationError({"otp": "Invalid or expired OTP."})
            
        if otp_record.otp != otp_code:
            raise serializers.ValidationError({"otp": "Invalid or expired OTP."})
            
        if timezone.now() > otp_record.created_at + timedelta(minutes=15):
            otp_record.delete()
            raise serializers.ValidationError({"otp": "OTP has expired."})
            
        attrs['user'] = user
        return attrs

class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    new_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        from .models import PasswordResetOTP
        from django.utils import timezone
        from datetime import timedelta
        
        email = attrs['email']
        otp_code = attrs['otp']
        
        try:
            user = User.objects.get(email=email)
            otp_record = PasswordResetOTP.objects.get(user=user)
        except (User.DoesNotExist, PasswordResetOTP.DoesNotExist):
            raise serializers.ValidationError({"otp": "Invalid or expired OTP."})
            
        if otp_record.otp != otp_code:
            raise serializers.ValidationError({"otp": "Invalid or expired OTP."})
            
        if timezone.now() > otp_record.created_at + timedelta(minutes=15):
            otp_record.delete()
            raise serializers.ValidationError({"otp": "OTP has expired."})
            
        validate_password(attrs['new_password'], user)
        attrs['user'] = user
        return attrs
