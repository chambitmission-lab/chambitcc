"""
데이터베이스 연결 테스트 스크립트
"""
import pymysql
import sys
from dotenv import load_dotenv
import os

# .env 파일 로드
load_dotenv()

# 연결 정보
DB_CONFIG = {
    'host': 'svc.sel3.cloudtype.app',
    'port': 32532,
    'user': 'cbadmin',
    'password': '!Acbadmin$',
    'database': 'chambit_db',
    'charset': 'utf8mb4',
    'connect_timeout': 10
}

print("=" * 60)
print("📡 클라우드타입 MariaDB 연결 테스트")
print("=" * 60)
print(f"\n연결 정보:")
print(f"  Host: {DB_CONFIG['host']}")
print(f"  Port: {DB_CONFIG['port']}")
print(f"  User: {DB_CONFIG['user']}")
print(f"  Database: {DB_CONFIG['database']}")
print(f"\n연결 시도 중...\n")

try:
    # 데이터베이스 연결 시도
    connection = pymysql.connect(**DB_CONFIG)
    
    print("✅ 연결 성공!")
    print("-" * 60)
    
    # 커서 생성
    with connection.cursor() as cursor:
        # 버전 확인
        cursor.execute("SELECT VERSION()")
        version = cursor.fetchone()
        print(f"📌 MariaDB 버전: {version[0]}")
        
        # 현재 데이터베이스 확인
        cursor.execute("SELECT DATABASE()")
        current_db = cursor.fetchone()
        print(f"📌 현재 데이터베이스: {current_db[0]}")
        
        # 테이블 목록 확인
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        
        if tables:
            print(f"\n📋 테이블 목록 ({len(tables)}개):")
            for table in tables:
                print(f"  - {table[0]}")
        else:
            print("\n📋 테이블이 아직 없습니다.")
        
        # 사용자 권한 확인
        cursor.execute("SHOW GRANTS FOR CURRENT_USER()")
        grants = cursor.fetchall()
        print(f"\n🔐 사용자 권한:")
        for grant in grants:
            print(f"  {grant[0]}")
    
    connection.close()
    print("\n" + "=" * 60)
    print("✅ 연결 테스트 완료!")
    print("=" * 60)
    sys.exit(0)
    
except pymysql.err.OperationalError as e:
    print(f"❌ 연결 실패: {e}")
    print("\n가능한 원인:")
    print("  1. 방화벽/보안 그룹에서 외부 접속 차단")
    print("  2. 데이터베이스가 실행 중이 아님")
    print("  3. 호스트/포트 정보 오류")
    print("  4. 사용자 이름 또는 비밀번호 오류")
    print("\n해결 방법:")
    print("  - 클라우드타입 콘솔에서 DB 상태 확인")
    print("  - 외부 접속 허용 설정 확인")
    print("  - 연결 정보 재확인")
    sys.exit(1)
    
except Exception as e:
    print(f"❌ 예상치 못한 오류: {e}")
    sys.exit(1)
