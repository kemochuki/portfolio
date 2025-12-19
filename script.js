const monthNames = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
let allImages = [], currentFilteredImages = [], currentIndex = 0;

const lightbox = document.getElementById('lightbox'), lightboxImg = document.getElementById('lightbox-img');
const closeBtn = document.getElementById('close-btn'), prevBtn = document.getElementById('prev-btn'), nextBtn = document.getElementById('next-btn');

// 1. 데이터 로드 및 초기화
fetch('image_list.json')
    .then(res => res.json())
    .then(data => {
        allImages = data;
        initMenu();
        if(data.length > 0) {
            const latestYear = [...new Set(data.map(d => d.year))].sort((a,b) => b-a)[0];
            filterImages(latestYear, null);
        }
    });

// 2. 연도/월 메뉴 생성
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

        const months = [...new Set(allImages.filter(i => i.year == year).map(i => i.month))].sort((a, b) => a - b);
        months.forEach(month => {
            const mBtn = document.createElement('button');
            mBtn.className = 'month-btn';
            mBtn.textContent = monthNames[month];
            mBtn.onclick = (e) => {
                e.stopPropagation();
                document.querySelectorAll('.month-btn').forEach(b => b.classList.remove('active'));
                mBtn.classList.add('active');
                filterImages(year, month);
            };
            const mLi = document.createElement('li');
            mLi.appendChild(mBtn);
            monthUl.appendChild(mLi);
        });

        yearBtn.onclick = () => {
            const isOpen = monthUl.classList.contains('open');
            document.querySelectorAll('.month-list').forEach(el => el.classList.remove('open'));
            if(!isOpen) monthUl.classList.add('open');
            document.querySelectorAll('.year-btn').forEach(b => b.classList.remove('active'));
            yearBtn.classList.add('active');
            filterImages(year, null);
        };

        li.append(yearBtn, monthUl);
        menuContainer.appendChild(li);
    });
}

// 3. 이미지 필터링 및 렌더링
async function filterImages(y, m) {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = '';
    currentFilteredImages = allImages.filter(img => m === null ? img.year == y : (img.year == y && img.month == m));

    const chunkSize = 10;
    for (let i = 0; i < currentFilteredImages.length; i += chunkSize) {
        const chunk = currentFilteredImages.slice(i, i + chunkSize);
        await new Promise(res => requestAnimationFrame(() => {
            renderChunk(chunk, i);
            res();
        }));
    }
}

function renderChunk(chunk, start) {
    const gallery = document.getElementById('gallery');
    chunk.forEach((imgData, i) => {
        const idx = start + i;
        const div = document.createElement('div');
        div.className = 'gallery-item';
        const img = document.createElement('img');
        img.dataset.src = imgData.path;
        img.loading = 'lazy';
        img.onclick = () => openLightbox(idx);
        div.appendChild(img);
        gallery.appendChild(div);
        observer.observe(img);
    });
}

// 4. 지연 로딩 및 높이 계산 (Masonry)
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) { img.src = img.dataset.src; img.removeAttribute('data-src'); }
            img.onload = () => {
                img.classList.add('loaded');
                entry.target.parentElement.classList.add('loaded');
                resizeGridItem(entry.target.parentElement);
            };
            observer.unobserve(img);
        }
    });
}, { rootMargin: '200px' });

function resizeGridItem(item) {
    const grid = document.querySelector('.gallery');
    const rowHeight = parseInt(window.getComputedStyle(grid).getPropertyValue('grid-auto-rows'));
    const rowGap = parseInt(window.getComputedStyle(grid).getPropertyValue('grid-gap'));
    const imgHeight = item.querySelector('img').getBoundingClientRect().height;
    const rowSpan = Math.ceil((imgHeight + rowGap) / (rowHeight + rowGap));
    item.style.gridRowEnd = "span " + rowSpan;
}

// 5. 라이트박스 기능
function openLightbox(index) {
    currentIndex = index;
    lightboxImg.src = currentFilteredImages[currentIndex].path;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() { lightbox.classList.remove('active'); document.body.style.overflow = 'auto'; }
function showNext() { currentIndex = (currentIndex + 1) % currentFilteredImages.length; openLightbox(currentIndex); }
function showPrev() { currentIndex = (currentIndex - 1 + currentFilteredImages.length) % currentFilteredImages.length; openLightbox(currentIndex); }

closeBtn.onclick = closeLightbox;
nextBtn.onclick = (e) => { e.stopPropagation(); showNext(); };
prevBtn.onclick = (e) => { e.stopPropagation(); showPrev(); };
lightbox.onclick = (e) => { if (e.target === lightbox) closeLightbox(); };

window.onresize = () => {
    document.querySelectorAll('.gallery-item').forEach(resizeGridItem);
};

document.onkeydown = (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') showNext();
    if (e.key === 'ArrowLeft') showPrev();
};