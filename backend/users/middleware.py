from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth import get_user_model

User = get_user_model()

class SingleSessionMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if 'Authorization' in request.headers:
            try:
                # Custom logic to check session_token
                header = request.headers.get('Authorization')
                if not header.startswith('Bearer '):
                    return None
                
                # We don't want to fully authenticate here if DRF does it later,
                # but we need the user to check the session_token.
                # Simplest way: extract user from token if possible.
                auth = JWTAuthentication()
                validated_token = auth.get_validated_token(header.split(' ')[1])
                user = auth.get_user(validated_token)
                
                # Extract session_token from token payload
                token_session = validated_token.get('session_token')
                
                if user and user.session_token and token_session != user.session_token:
                    return JsonResponse(
                        {"detail": "Logged in elsewhere. Please log in again."}, 
                        status=401
                    )
            except Exception:
                # Let DRF handle standard auth errors
                pass
        return None
