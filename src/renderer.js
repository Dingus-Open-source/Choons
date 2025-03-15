let musicList = [];
let virtualScroller;

class VirtualScroller {
    constructor(container, itemHeight) {
        this.container = container;
        this.itemHeight = itemHeight;
        this.items = [];
        this.scrollTop = 0;
        this.visibleItems = new Map();
        
        this.container.addEventListener('scroll', this.onScroll.bind(this), {
            passive: true
        });
        
        // Use ResizeObserver for container size changes
        this.observer = new ResizeObserver(entries => {
            this.render();
        });
        this.observer.observe(container);
    }

    setItems(items) {
        this.items = items;
        this.container.style.height = `${items.length * this.itemHeight}px`;
        this.render();
    }

    onScroll() {
        requestAnimationFrame(() => this.render());
    }

    render() {
        const containerHeight = this.container.clientHeight;
        const scrollTop = this.container.scrollTop;
        
        const startIndex = Math.floor(scrollTop / this.itemHeight);
        const endIndex = Math.min(
            startIndex + Math.ceil(containerHeight / this.itemHeight) + 1,
            this.items.length
        );

        // Remove items that are no longer visible
        for (const [index, element] of this.visibleItems.entries()) {
            if (index < startIndex || index >= endIndex) {
                element.remove();
                this.visibleItems.delete(index);
            }
        }

        // Add new visible items
        for (let i = startIndex; i < endIndex; i++) {
            if (!this.visibleItems.has(i)) {
                const item = this.items[i];
                const element = this.createItemElement(item, i);
                this.container.appendChild(element);
                this.visibleItems.set(i, element);
            }
        }
    }

    createItemElement(item, index) {
        const element = document.createElement('tr');
        element.className = 'track-item';
        element.style.position = 'absolute';
        element.style.top = `${index * this.itemHeight}px`;
        element.style.height = `${this.itemHeight}px`;
        element.innerHTML = `
            <td>${item.title}</td>
            <td>${item.artist}</td>
            <td>${item.album}</td>
            <td>${this.formatDuration(item.duration)}</td>
        `;
        return element;
    }

    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    destroy() {
        this.observer.disconnect();
        this.container.removeEventListener('scroll', this.onScroll);
    }
}

// Initialize virtual scroller when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('musicList');
    virtualScroller = new VirtualScroller(container, 30); // 30px row height

    // Debounced search function
    const searchInput = document.getElementById('searchInput');
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = e.target.value.toLowerCase();
            const filtered = musicList.filter(track => 
                track.title.toLowerCase().includes(query) ||
                track.artist.toLowerCase().includes(query) ||
                track.album.toLowerCase().includes(query)
            );
            virtualScroller.setItems(filtered);
        }, 150);
    }, { passive: true });

    // Load initial data
    window.electronAPI.loadLibrary().then(data => {
        musicList = data;
        virtualScroller.setItems(data);
    });

    const musicListElement = document.getElementById('music-list');
    const playlistsList = document.getElementById('playlists-list');
    const dragOverlay = document.getElementById('drag-overlay');
    let draggedItem = null;

    // Handle drag and drop
    document.addEventListener('dragstart', (e) => {
        if (e.target.matches('#music-list tr')) {
            draggedItem = e.target;
            e.dataTransfer.setData('text/plain', e.target.dataset.songId);
            dragOverlay.classList.remove('hidden');
        }
    });

    document.addEventListener('dragend', () => {
        dragOverlay.classList.add('hidden');
    });

    playlistsList.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    });

    playlistsList.addEventListener('dragleave', (e) => {
        e.currentTarget.classList.remove('drag-over');
    });

    playlistsList.addEventListener('drop', (e) => {
        e.preventDefault();
        const songId = e.dataTransfer.getData('text/plain');
        e.currentTarget.classList.remove('drag-over');
        // Handle adding song to playlist
        window.electronAPI.addToPlaylist(songId);
    });

    // Handle music selection
    musicListElement.addEventListener('click', (e) => {
        const row = e.target.closest('tr');
        if (row) {
            document.querySelectorAll('#music-list tr').forEach(tr => {
                tr.classList.remove('selected');
            });
            row.classList.add('selected');
        }
    });

    // Double click to play
    musicListElement.addEventListener('dblclick', (e) => {
        const row = e.target.closest('tr');
        if (row) {
            window.electronAPI.playTrack(row.dataset.songId);
        }
    });

    // Load initial music library
    window.electronAPI.loadLibrary().then(songs => {
        renderMusicLibrary(songs);
    });

    const playButton = document.getElementById('play')
    const prevButton = document.getElementById('prev')
    const nextButton = document.getElementById('next')
    const currentTrack = document.getElementById('current-track')

    let isPlaying = false

    playButton.addEventListener('click', () => {
        if (isPlaying) {
            window.electron.pauseTrack()
            playButton.textContent = 'Play'
        } else {
            window.electron.playTrack()
            playButton.textContent = 'Pause'
        }
        isPlaying = !isPlaying
    })

    prevButton.addEventListener('click', () => {
        window.electron.prevTrack()
    })

    nextButton.addEventListener('click', () => {
        window.electron.nextTrack()
    })

    // Load initial music library
    window.electron.loadMusic().then(songs => {
        musicListElement.innerHTML = songs.map(song => `
            <tr class="hover:bg-gray-700">
                <td class="p-2">${song.title}</td>
                <td class="p-2">${song.artist}</td>
                <td class="p-2">${song.album}</td>
                <td class="p-2">${formatTime(song.duration)}</td>
            </tr>
        `).join('')
    })
})

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Clean up on window unload
window.addEventListener('beforeunload', () => {
    if (virtualScroller) {
        virtualScroller.destroy();
    }
});