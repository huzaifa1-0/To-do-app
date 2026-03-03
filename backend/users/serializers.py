from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'first_name', 'last_name', 'email', 'password', 'confirm_password')
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        validate_password(attrs['password'])
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = User.objects.create_user(**validated_data)
        return user

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
