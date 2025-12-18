import os
import json

# 이미지 파일 확장자 설정
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}

def generate_image_list():
    data = []
    root_dir = 'images'

    if not os.path.exists(root_dir):
        print(f"Error: '{root_dir}' 폴더가 없습니다.")
        return

    # 폴더 탐색
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if os.path.splitext(file)[1].lower() in IMAGE_EXTENSIONS:
                # 경로: images/2025/1/photo.jpg
                path_parts = os.path.normpath(root).split(os.sep)
                
                # 폴더 구조가 images/연도/월 형태인지 확인
                if len(path_parts) >= 3:
                    try:
                        year = int(path_parts[1]) # 2025
                        month = int(path_parts[2]) # 1
                        file_path = os.path.join(root, file).replace('\\', '/') # 윈도우 경로 호환
                        
                        data.append({
                            "year": year,
                            "month": month,
                            "path": file_path
                        })
                    except ValueError:
                        continue

    # JSON 파일로 저장
    with open('image_list.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"완료! 총 {len(data)}개의 이미지를 리스트에 담았습니다.")

if __name__ == "__main__":
    generate_image_list()
