const monthNames = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

let allImages = [];
let currentFilteredImages = []; // 현재 화면에 보이는 이미지 리스트 (필터링된 결과)
let currentIndex = 0; // 현재 보고 있는 라이트박스 이미지 인덱스

// DOM 요소 미리 가져오기
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const closeBtn = document.getElementById('close-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

// 1. 데이터 로드
fetch('image_list.json')
    .then(response => response.json())
    .then(data => {
        allImages = data;
        initMenu();
        if(data.length > 0) {
            const latestYear = [...new Set(data.map(d => d.year))].sort().reverse()[0];
            filterImages(latestYear, null);
        }
    })
    .catch(error => console.error('Error:', error));

function initMenu() {
    const menuContainer = document.getElementById('year-menu');
    const years = [...new Set(allImages.map(img => img.year))].sort((a, b) => b - a);

    years.forEach(year => {
        const li = document.createElement('li');
        li.className = 'year-item';

        const yearBtn = document.createElement('button');
        yearBtn.className = 'year-btn';
        yearBtn.textContent = year;
        
        const monthUl = document.createElement('ul');
        monthUl.className = 'month-list';
        monthUl.id = `month-list-${year}`;

        const monthsInYear = [...new Set(allImages
            .filter(img => img.year == year)
            .map(img => img.month)
        )].sort((a, b) => a - b);

        monthsInYear.forEach(month => {
            const monthLi = document.createElement('li');
            const monthBtn = document.createElement('button');
            monthBtn.className = 'month-btn';
            monthBtn.textContent = monthNames[month];
            
            monthBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.month-btn').forEach(b => b.classList.remove('active'));
                monthBtn.classList.add('active');
                filterImages(year, month);
            });

            monthLi.appendChild(monthBtn);
            monthUl.appendChild(monthLi);
        });

        yearBtn.addEventListener('click', () => {
            monthUl.classList.toggle('open');
            document.querySelectorAll('.year-btn').forEach(b => b.classList.remove('active'));
            yearBtn.classList.add('active');
            document.querySelectorAll('.month-btn').forEach(b => b.classList.remove('active'));
            filterImages(year, null);
        });

        li.appendChild(yearBtn);
        li.appendChild(monthUl);
        menuContainer.appendChild(li);
    });
}

async function filterImages(targetYear, targetMonth) {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = ''; 

    currentFilteredImages = allImages.filter(img => {
        if (targetMonth === null) return img.year == targetYear;
        return img.year == targetYear && img.month == targetMonth;
    });

    // 효율적 로딩을 위해 이미지 리스트를 10개씩 끊어서 처리 (비동기 청크 렌더링)
    const chunkSize = 10;
    for (let i = 0; i < currentFilteredImages.length; i += chunkSize) {
        const chunk = currentFilteredImages.slice(i, i + chunkSize);
        
        // requestAnimationFrame이나 setTimeout을 써서 브라우저에게 숨 쉴 틈을 줌
        await new Promise(resolve => {
            requestAnimationFrame(() => {
                renderChunk(chunk, i);
                resolve();
            });
        });
    }
}

function renderChunk(chunk, startIndex) {
    const gallery = document.getElementById('gallery');

    chunk.forEach((imgData, index) => {
        const actualIndex = startIndex + index;
        const div = document.createElement('div');
        div.className = 'gallery-item';
        
        const img = document.createElement('img');
        
        // 1. 실제 경로는 data-src에 숨겨둠 (비동기 로딩용)
        img.dataset.src = imgData.path; 
        img.alt = `Photo ${imgData.year}-${imgData.month}`;
        img.loading = 'lazy'; // 브라우저 네이티브 지연 로딩 활용

        // 클릭 이벤트
        img.addEventListener('click', () => openLightbox(actualIndex));

        div.appendChild(img);
        gallery.appendChild(div);

        // 2. Intersection Observer를 사용하여 화면에 보일 때 src 주입
        observer.observe(img);
    });
}

// Intersection Observer 설정
const observerOptions = {
    root: null, // viewport 기준
    rootMargin: '200px', // 화면에 보이기 200px 전에 미리 로드 시작
    threshold: 0.01
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            // data-src에 있던 값을 실제 src로 옮기면서 로딩 시작
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            }
            
            img.onload = () => {
                img.classList.add('loaded'); // 이미지 페이드인
                img.parentElement.classList.add('loaded'); // 스켈레톤 애니메이션 정지
            };
            
            observer.unobserve(img); // 한 번 로드된 이미지는 관찰 중단
        }
    });
}, observerOptions);

// --- 라이트박스 관련 함수들 ---

function openLightbox(index) {
    currentIndex = index;
    updateLightboxImage();
    console.log('hiii');
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden'; // 배경 스크롤 방지
}

function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = 'auto'; // 스크롤 복구
}

function updateLightboxImage() {
    // 안전장치: 이미지가 없을 경우
    console.log('아');
    if (currentFilteredImages.length === 0) return;
    console.log('앙');
    
    const imgData = currentFilteredImages[currentIndex];
    lightboxImg.src = imgData.path;
}

function showNext() {
    currentIndex = (currentIndex + 1) % currentFilteredImages.length; // 마지막이면 처음으로
    updateLightboxImage();
}

function showPrev() {
    currentIndex = (currentIndex - 1 + currentFilteredImages.length) % currentFilteredImages.length; // 처음이면 마지막으로
    updateLightboxImage();
}

// --- 이벤트 리스너 등록 ---

// 1. 닫기 버튼 클릭
closeBtn.addEventListener('click', closeLightbox);

// 2. 오버레이(배경) 클릭 시 닫기
lightbox.addEventListener('click', (e) => {
    // 클릭된 대상이 이미지나 네비게이션 버튼이 아닐 때만 닫기
    if (e.target === lightbox || e.target.classList.contains('lightbox-content')) {
        closeLightbox();
    }
});

// 3. 네비게이션 버튼
nextBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // 배경 클릭 이벤트 전파 방지
    showNext();
});

prevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    showPrev();
});

// 4. 키보드 이벤트 (ESC: 닫기, 좌우화살표: 이동)
document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;

    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') showNext();
    if (e.key === 'ArrowLeft') showPrev();
});