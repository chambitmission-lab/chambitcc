"""
인증 API 테스트 스크립트
"""
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

print("=" * 60)
print("🔐 인증 API 테스트")
print("=" * 60)

# 1. 회원가입 테스트
print("\n1️⃣ 회원가입 테스트")
print("-" * 60)

register_data = {
    "email": "newuser@example.com",
    "username": "newuser",
    "password": "password123",
    "full_name": "새로운 사용자"
}

try:
    response = requests.post(
        f"{BASE_URL}/auth/register",
        json=register_data
    )
    
    if response.status_code == 200:
        user = response.json()
        print(f"✅ 회원가입 성공!")
        print(f"   ID: {user['id']}")
        print(f"   이메일: {user['email']}")
        print(f"   사용자명: {user['username']}")
        print(f"   이름: {user.get('full_name', 'N/A')}")
    else:
        print(f"❌ 회원가입 실패: {response.status_code}")
        print(f"   응답: {response.text}")
except Exception as e:
    print(f"❌ 에러: {e}")

# 2. 로그인 테스트
print("\n2️⃣ 로그인 테스트")
print("-" * 60)

login_data = {
    "username": "testuser",
    "password": "test1234"
}

try:
    response = requests.post(
        f"{BASE_URL}/auth/login",
        data=login_data,  # OAuth2PasswordRequestForm은 form data 사용
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    if response.status_code == 200:
        token_data = response.json()
        print(f"✅ 로그인 성공!")
        print(f"   토큰: {token_data['access_token'][:50]}...")
        print(f"   타입: {token_data['token_type']}")
        
        # 토큰 저장
        access_token = token_data['access_token']
    else:
        print(f"❌ 로그인 실패: {response.status_code}")
        print(f"   응답: {response.text}")
except Exception as e:
    print(f"❌ 에러: {e}")

print("\n" + "=" * 60)
print("✅ 테스트 완료!")
print("=" * 60)
