"""
직접 함수 호출 테스트
"""
from app.core.database import SessionLocal
from app.services.auth_service import auth_service
from app.schemas.user import UserCreate

print("=" * 60)
print("🔐 직접 함수 호출 테스트")
print("=" * 60)

db = SessionLocal()

try:
    # 1. 기존 사용자 확인
    print("\n1️⃣ 기존 사용자 확인")
    existing = auth_service.get_user_by_username(db, "testuser")
    if existing:
        print(f"✅ 기존 사용자 존재: {existing.username}")
    else:
        print("❌ 사용자 없음")
    
    # 2. 새 사용자 생성
    print("\n2️⃣ 새 사용자 생성")
    try:
        user_in = UserCreate(
            email="direct@example.com",
            username="directuser",
            password="password123",
            full_name="직접 테스트"
        )
        new_user = auth_service.create_user(db, user_in)
        print(f"✅ 사용자 생성 성공: {new_user.username}")
    except Exception as e:
        print(f"❌ 생성 실패: {e}")
    
    # 3. 인증 테스트
    print("\n3️⃣ 인증 테스트")
    auth_user = auth_service.authenticate_user(db, "testuser", "test1234")
    if auth_user:
        print(f"✅ 인증 성공: {auth_user.username}")
        
        # 4. 토큰 생성
        print("\n4️⃣ 토큰 생성")
        token = auth_service.create_token(auth_user.id)
        print(f"✅ 토큰 생성 성공: {token[:50]}...")
    else:
        print("❌ 인증 실패")
        
except Exception as e:
    print(f"❌ 에러 발생: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()

print("\n" + "=" * 60)
