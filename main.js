// Inisialisasi Socket.IO
const socket = io('http://localhost:3000');

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const cover = document.querySelector('.cover');
    const mainContent = document.querySelector('.main-content');
    const btnOpen = document.querySelector('.open-button');
    const audioPlayer = document.getElementById('bgMusic');
    const audioControl = document.getElementById('audioControl');
    const commentForm = document.getElementById('commentForm');
    const commentsList = document.getElementById('commentsList');

    // Socket event listener untuk komentar baru
    socket.on('newComment', (comment) => {
        appendComment(comment);
        // Reload comments untuk memastikan pagination tetap akurat
        loadComments(1);
    });

    // Socket event untuk komentar yang dihapus
    socket.on('commentDeleted', (commentId) => {
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (commentElement) {
            commentElement.remove();
        }
        loadComments(1);
    });

    // Fungsi untuk copy nomor rekening
    window.copyToClipboard = function(text) {
        navigator.clipboard.writeText(text).then(() => {
            alert('Nomor rekening berhasil disalin!');
        }).catch(err => {
            console.error('Gagal menyalin teks: ', err);
        });
    }

    // Fungsi untuk membuka undangan
    function openInvitation() {
        cover.classList.add('opened');
        setTimeout(() => {
            mainContent.classList.add('visible');
        }, 500);
        
        // Play music
        if(audioPlayer) {
            audioPlayer.play().catch(function(error) {
                console.log("Audio play failed:", error);
            });
        }
    }

    // Event listener untuk tombol buka undangan
    if(btnOpen) {
        btnOpen.addEventListener('click', openInvitation);
    }

    // Fungsi untuk mengontrol musik
    let isPlaying = false;

    function toggleAudio() {
        if(audioPlayer) {
            if (isPlaying) {
                audioPlayer.pause();
                audioControl.innerHTML = '<i class="fas fa-music"></i>';
            } else {
                audioPlayer.play();
                audioControl.innerHTML = '<i class="fas fa-pause"></i>';
            }
            isPlaying = !isPlaying;
        }
    }

    if(audioControl) {
        audioControl.addEventListener('click', toggleAudio);
    }

    // Countdown Timer
    function updateCountdown() {
        const weddingDate = new Date('2025-06-15T09:00:00').getTime();
        const now = new Date().getTime();
        const distance = weddingDate - now;

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        const countdownElement = document.getElementById('countdown');
        if(countdownElement) {
            countdownElement.innerHTML = `
                <div class="countdown-item">
                    <div class="countdown-number">${days}</div>
                    <div class="countdown-label">Hari</div>
                </div>
                <div class="countdown-item">
                    <div class="countdown-number">${hours}</div>
                    <div class="countdown-label">Jam</div>
                </div>
                <div class="countdown-item">
                    <div class="countdown-number">${minutes}</div>
                    <div class="countdown-label">Menit</div>
                </div>
                <div class="countdown-item">
                    <div class="countdown-number">${seconds}</div>
                    <div class="countdown-label">Detik</div>
                </div>
            `;
        }

        if (distance < 0) {
            clearInterval(countdownInterval);
            if(countdownElement) {
                countdownElement.innerHTML = "Acara telah selesai";
            }
        }
    }

    // Update countdown setiap detik
    const countdownInterval = setInterval(updateCountdown, 1000);
    updateCountdown();

    // Modal Image
    window.openModal = function(imgSrc) {
        const modal = document.getElementById('imageModal');
        const modalImg = document.getElementById('modalImage');
        if(modal && modalImg) {
            modal.style.display = 'block';
            modalImg.src = imgSrc;
        }
    }

    window.closeModal = function() {
        const modal = document.getElementById('imageModal');
        if(modal) {
            modal.style.display = 'none';
        }
    }

    // Event listener untuk modal
    const modal = document.getElementById('imageModal');
    if(modal) {
        modal.addEventListener('click', function(e) {
            if(e.target === this) {
                closeModal();
            }
        });
    }

    // Gallery image click handlers
    document.querySelectorAll('.gallery-item img').forEach(img => {
        img.addEventListener('click', function() {
            openModal(this.src);
        });
    });

    // Fungsi untuk mengambil komentar dengan pagination
    async function loadComments(page = 1) {
        try {
            const response = await fetch(`http://localhost:3000/api/comments?page=${page}`);
            const data = await response.json();
            
            const commentsList = document.getElementById('commentsList');
            const paginationElement = document.getElementById('commentsPagination');
            
            // Render comments
            commentsList.innerHTML = '';
            data.comments.forEach(comment => {
                appendComment(comment);
            });

            // Render pagination
            renderPagination(data.pagination);
        } catch (error) {
            console.error('Error:', error);
            alert('Gagal memuat komentar');
        }
    }

    // Fungsi untuk menambahkan komentar baru
    async function addComment(name, attendance, message) {
        try {
            const response = await fetch('http://localhost:3000/api/comments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    attendance,
                    message
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            
            // Komentar akan ditampilkan melalui socket event
        } catch (error) {
            console.error('Error:', error);
            alert('Gagal mengirim komentar');
        }
    }

    // Fungsi untuk menambahkan satu komentar ke DOM
    function appendComment(comment) {
        const commentsList = document.getElementById('commentsList');
        const commentElement = document.createElement('div');
        commentElement.className = 'comment';
        commentElement.dataset.commentId = comment.id;
        commentElement.innerHTML = `
            <div class="comment-header">
                <span class="comment-name">${comment.name}</span>
                <span class="comment-time">${formatDate(comment.timestamp)}</span>
            </div>
            <div class="comment-attendance">
                ${comment.attendance === 'hadir' ? 
                    '<span class="badge-success">Hadir</span>' : 
                    '<span class="badge-danger">Tidak Hadir</span>'}
            </div>
            <div class="comment-message">
                ${comment.message}
            </div>
        `;
        commentsList.insertBefore(commentElement, commentsList.firstChild);
    }

    // Fungsi untuk render pagination
    function renderPagination(pagination) {
        const { currentPage, totalPages, hasNext, hasPrev } = pagination;
        const paginationElement = document.getElementById('commentsPagination');
        
        let paginationHTML = '<div class="pagination">';
        
        if (hasPrev) {
            paginationHTML += `<button onclick="loadComments(${currentPage - 1})">Prev</button>`;
        }

        // Show first page
        if (currentPage > 2) {
            paginationHTML += `<button onclick="loadComments(1)">1</button>`;
            if (currentPage > 3) {
                paginationHTML += '<span>...</span>';
            }
        }

        // Show current page and neighbors
        for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) {
            paginationHTML += `<button class="${i === currentPage ? 'active' : ''}" 
                onclick="loadComments(${i})">${i}</button>`;
        }

        // Show last page
        if (currentPage < totalPages - 1) {
            if (currentPage < totalPages - 2) {
                paginationHTML += '<span>...</span>';
            }
            paginationHTML += `<button onclick="loadComments(${totalPages})">${totalPages}</button>`;
        }

        if (hasNext) {
            paginationHTML += `<button onclick="loadComments(${currentPage + 1})">Next</button>`;
        }

        paginationHTML += '</div>';
        paginationElement.innerHTML = paginationHTML;
    }

    function formatDate(dateString) {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    }

    // Event listener untuk form komentar
    if(commentForm) {
        commentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const attendance = document.getElementById('attendance').value;
            const message = document.getElementById('message').value;
            
            addComment(name, attendance, message);
            this.reset();
        });
    }

    // Load comments saat halaman dimuat
    loadComments(1);

    // Smooth scroll untuk semua link anchor
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if(target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Initialize AOS
    if(typeof AOS !== 'undefined') {
        AOS.init({
            duration: 1000,
            once: true
        });
    }

    // Global function untuk loadComments (diperlukan untuk pagination)
    window.loadComments = loadComments;
});