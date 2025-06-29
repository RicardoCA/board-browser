const desktopContainer = document.getElementById('desktop-container');
const desktop = document.getElementById('desktop');
const btnNewTab = document.getElementById('btnNewTab');
const dropdownMenu = document.getElementById('dropdown-menu');
const btnCreateTab = document.getElementById('btnCreateTab');
const btnCreateTextField = document.getElementById('btnCreateTextField');
const btnCreateList = document.getElementById('btnCreateList');
const btnCreateBoard = document.getElementById('btnCreateBoard');
const boardsContainer = document.getElementById('boards-container');
const btnFavorites = document.getElementById('btnFavorites');
const favoritesModal = document.getElementById('favoritesModal');
const favoritesGrid = document.getElementById('favoritesGrid');
const btnMoreOptions = document.getElementById('btnMoreOptions');
const moreOptionsMenu = document.getElementById('more-options-menu');
const btnExportBoards = document.getElementById('btnExportBoards');
const btnImportBoards = document.getElementById('btnImportBoards');
const btnRenameBoards = document.getElementById('btnRenameBoards');
const renameModal = document.getElementById('renameModal');
const renameBoardSelect = document.getElementById('renameBoardSelect');
const renameBoardInput = document.getElementById('renameBoardInput');
const btnSaveRename = document.getElementById('btnSaveRename');
const closeModalButtons = document.querySelectorAll('.close-modal');
const importModal = document.getElementById('importModal');
const importFileInput = document.getElementById('importFileInput');
const importFileName = document.getElementById('importFileName');
const importOverwriteCheckbox = document.getElementById('importOverwriteCheckbox');
const btnImportConfirm = document.getElementById('btnImportConfirm');
const zoomAreaTrigger = document.getElementById('zoom-area-trigger');
const zoomControls = document.getElementById('zoom-controls');
const zoomOutBtn = document.getElementById('zoom-out');
const zoomInBtn = document.getElementById('zoom-in');
const zoomSlider = document.getElementById('zoom-slider');
const zoomLevel = document.getElementById('zoom-level');
const resetZoomBtn = document.getElementById('reset-zoom');
const btnMoveMode = document.getElementById('btnMoveMode');
const btnBrush = document.getElementById('btnBrush');
const btnEraser = document.getElementById('btnEraser');
const btnClean = document.getElementById('btnClean');
const colorPickerMenu = document.getElementById('color-picker-menu');
const colorOptions = document.querySelectorAll('.color-option');
const brushSizeControl = document.getElementById('brush-size-control');
const brushSizeValue = document.getElementById('brush-size-value');
const drawingCanvas = document.getElementById('drawing-canvas');
const ctx = drawingCanvas.getContext('2d');

const btnSettings = document.getElementById('btnSettings');
const settingsModal = document.getElementById('settingsModal');
const startPageInput = document.getElementById('startPageInput');
const searchEngineSelect = document.getElementById('searchEngineSelect');
const btnSaveSettings = document.getElementById('btnSaveSettings');
const btnClearHistory = document.getElementById('btnClearHistory');
var isCopyModeActive = false;





let defaultStartPage = localStorage.getItem('startPage') || 'https://www.google.com';
let defaultSearchEngine = localStorage.getItem('searchEngine') || 'google';


let boards = {};
let currentBoardId = null;
let tabIdCounter = 0;
let textFieldIdCounter = 0;
let listIdCounter = 0;
let boardIdCounter = 0;
let activeTabId = null;
let activeTextFieldId = null;
let activeListId = null;
let currentZoom = 100;
let isDraggingDesktop = false;
let startDragX, startDragY;
let startScrollLeft, startScrollTop;
let favorites = JSON.parse(localStorage.getItem('browserFavorites')) || [];
let isDrawing = false;
let isMoveModeActive = false;
let currentColor = '#ff0000';
let currentBrushSize = 5;
let isErasing = false;
let drawingData = JSON.parse(localStorage.getItem('drawingData')) || {};
let browsingHistory = JSON.parse(localStorage.getItem('browsingHistory')) || [];

btnClearHistory.addEventListener('click', () => {
    if (confirm("Are you sure you want to clear the browsing history?")) {
        browsingHistory = [];
        localStorage.setItem('browsingHistory', JSON.stringify(browsingHistory));
        alert("Browsing history cleared.");
    }
});

function addToHistory(url) {
    if (!browsingHistory.includes(url)) {
        browsingHistory.push(url);
        localStorage.setItem('browsingHistory', JSON.stringify(browsingHistory));
    }
}


btnSettings.addEventListener('click', () => {
    startPageInput.value = defaultStartPage;
    searchEngineSelect.value = defaultSearchEngine;
    settingsModal.style.display = 'flex';
    moreOptionsMenu.style.display = 'none';
});

btnSaveSettings.addEventListener('click', () => {
    defaultStartPage = startPageInput.value.trim() || 'https://www.google.com';
        defaultSearchEngine = searchEngineSelect.value;
        localStorage.setItem('startPage', defaultStartPage);
        localStorage.setItem('searchEngine', defaultSearchEngine);
        settingsModal.style.display = 'none';
});



btnClean.addEventListener('click', (e) => {
    e.stopPropagation();


    // Confirmação antes de limpar
    if (confirm('Are you sure you want to clear the board?')) {
        clearDrawing();
        alert('Board cleaned.');
    }
});

function clearDrawing() {
    ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    delete drawingData[currentBoardId];
    localStorage.setItem('drawingData', JSON.stringify(drawingData));
    loadDrawing(); // Recarrega o canvas vazio
}

// Inicializa o canvas de desenho
function initDrawingCanvas() {
    resizeCanvas();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.globalCompositeOperation = 'source-over';
    loadDrawing();
    setupDrawingEvents();
}

function resizeCanvas() {
    drawingCanvas.width = desktop.offsetWidth * (currentZoom / 100);
    drawingCanvas.height = desktop.offsetHeight * (currentZoom / 100);
    loadDrawing();
}

function setupDrawingEvents() {
    drawingCanvas.removeEventListener('mousedown', startDrawing);
    drawingCanvas.removeEventListener('mousemove', draw);
    drawingCanvas.removeEventListener('mouseup', stopDrawing);
    drawingCanvas.removeEventListener('mouseout', stopDrawing);
    drawingCanvas.removeEventListener('touchstart', handleTouchStart);
    drawingCanvas.removeEventListener('touchmove', handleTouchMove);
    drawingCanvas.removeEventListener('touchend', handleTouchEnd);

    drawingCanvas.addEventListener('mousedown', startDrawing);
    drawingCanvas.addEventListener('mousemove', draw);
    drawingCanvas.addEventListener('mouseup', stopDrawing);
    drawingCanvas.addEventListener('mouseout', stopDrawing);
    drawingCanvas.addEventListener('touchstart', handleTouchStart);
    drawingCanvas.addEventListener('touchmove', handleTouchMove);
    drawingCanvas.addEventListener('touchend', handleTouchEnd);
}

function startDrawing(e) {
    if (!isDrawingModeActive()) return;

    isDrawing = true;
    const rect = drawingCanvas.getBoundingClientRect();
    const scale = currentZoom / 100;

    let x = (e.clientX - rect.left) / scale;
    let y = (e.clientY - rect.top) / scale;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();
}

function draw(e) {
    if (!isDrawing) return;

    const rect = drawingCanvas.getBoundingClientRect();
    const scale = currentZoom / 100;

    let x = (e.clientX - rect.left) / scale;
    let y = (e.clientY - rect.top) / scale;

    if (isErasing) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = currentColor;
    }

    ctx.lineWidth = currentBrushSize;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    saveDrawing();
}

function stopDrawing() {
    if (!isDrawing) return;

    isDrawing = false;
    ctx.beginPath();
    saveDrawing();
}

function saveDrawing() {
    const dataUrl = drawingCanvas.toDataURL();
    drawingData[currentBoardId] = dataUrl;
    localStorage.setItem('drawingData', JSON.stringify(drawingData));
}

function loadDrawing() {
    if (!drawingData[currentBoardId]) {
        ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        return;
    }

    const img = new Image();
    img.onload = function() {
        ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        ctx.drawImage(img, 0, 0);
    };
    img.src = drawingData[currentBoardId];
}

function clearDrawing() {
    ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    delete drawingData[currentBoardId];
    localStorage.setItem('drawingData', JSON.stringify(drawingData));
}

function isDrawingModeActive() {
    return btnBrush.classList.contains('active') || btnEraser.classList.contains('active');
}

function handleTouchStart(e) {
    e.preventDefault();
    if (!isDrawingModeActive()) return;

    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    drawingCanvas.dispatchEvent(mouseEvent);
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!isDrawingModeActive()) return;

    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    drawingCanvas.dispatchEvent(mouseEvent);
}

function handleTouchEnd(e) {
    e.preventDefault();
    if (!isDrawingModeActive()) return;

    const mouseEvent = new MouseEvent('mouseup', {});
    drawingCanvas.dispatchEvent(mouseEvent);
}

// Configura eventos para as ferramentas de desenho
btnBrush.addEventListener('click', () => {
    btnBrush.classList.toggle('active');

    if (btnBrush.classList.contains('active')) {
        btnEraser.classList.remove('active');
        btnMoveMode.classList.remove('active');
        isMoveModeActive = false;
        isErasing = false;
        drawingCanvas.classList.add('drawing-mode');
        drawingCanvas.classList.remove('erasing-mode');
        colorPickerMenu.style.display = 'flex';
    } else {
        drawingCanvas.classList.remove('drawing-mode');
        colorPickerMenu.style.display = 'none';
    }
});

btnEraser.addEventListener('click', () => {
    btnEraser.classList.toggle('active');

    if (btnEraser.classList.contains('active')) {
        btnBrush.classList.remove('active');
        btnMoveMode.classList.remove('active');
        isMoveModeActive = false;
        isErasing = true;
        drawingCanvas.classList.add('erasing-mode');
        drawingCanvas.classList.remove('drawing-mode');
        colorPickerMenu.style.display = 'none';
    } else {
        drawingCanvas.classList.remove('erasing-mode');
    }
});

btnMoveMode.addEventListener('click', () => {
    isMoveModeActive = !isMoveModeActive;
    btnMoveMode.classList.toggle('active');

    // Atualiza o cursor dos cabeçalhos de Text Fields e Lists
    document.querySelectorAll('.textfield-header, .list-header').forEach(header => {
        header.style.cursor = isMoveModeActive ? 'move' : 'default';
    });

    if (isMoveModeActive) {
        btnBrush.classList.remove('active');
        btnEraser.classList.remove('active');
        isDrawing = false;
        drawingCanvas.classList.remove('drawing-mode');
        drawingCanvas.classList.remove('erasing-mode');
        colorPickerMenu.style.display = 'none';
    }
});

// Mostra/esconde o menu de seleção de cores
btnBrush.addEventListener('mouseenter', () => {
    if (btnBrush.classList.contains('active')) {
        colorPickerMenu.style.display = 'flex';
    }
});

btnBrush.addEventListener('mouseleave', () => {
    colorPickerMenu.style.display = 'none';
});

colorPickerMenu.addEventListener('mouseenter', () => {
    colorPickerMenu.style.display = 'flex';
});

colorPickerMenu.addEventListener('mouseleave', () => {
    colorPickerMenu.style.display = 'none';
});

// Seleciona cor
colorOptions.forEach(option => {
    option.addEventListener('click', () => {
        colorOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        currentColor = option.dataset.color;
    });
});

// Ajusta tamanho do pincel
brushSizeControl.addEventListener('input', () => {
    currentBrushSize = brushSizeControl.value;
    brushSizeValue.textContent = `${currentBrushSize}px`;
});

// Controle do dropdown menu
btnNewTab.addEventListener('mouseenter', () => {
    dropdownMenu.style.display = 'block';
});

btnNewTab.parentElement.addEventListener('mouseleave', () => {
    dropdownMenu.style.display = 'none';
});

btnCreateTab.addEventListener('click', () => {
    createTab();
    dropdownMenu.style.display = 'none';
});

btnCreateTextField.addEventListener('click', () => {
    createTextField();
    dropdownMenu.style.display = 'none';
});

btnCreateList.addEventListener('click', () => {
    createList();
    dropdownMenu.style.display = 'none';
});

btnCreateBoard.addEventListener('click', () => {
    createBoard(`Board ${boardIdCounter + 1}`);
    dropdownMenu.style.display = 'none';
});

// Controle do menu de mais opções
btnMoreOptions.addEventListener('click', (e) => {
    e.stopPropagation();
    moreOptionsMenu.style.display = moreOptionsMenu.style.display === 'block' ? 'none' : 'block';
    dropdownMenu.style.display = 'none';
});

document.addEventListener('click', (e) => {
    if (!btnMoreOptions.contains(e.target) && !moreOptionsMenu.contains(e.target)) {
        moreOptionsMenu.style.display = 'none';
    }
});

// Função para exportar boards
btnExportBoards.addEventListener('click', () => {
    exportBoards();
    moreOptionsMenu.style.display = 'none';
});

// Função para importar boards
btnImportBoards.addEventListener('click', () => {
    showImportModal();
    moreOptionsMenu.style.display = 'none';
});

// Função para renomear boards
btnRenameBoards.addEventListener('click', () => {
    showRenameModal();
    moreOptionsMenu.style.display = 'none';
});

// Controles de zoom
zoomOutBtn.addEventListener('click', () => {
    setZoom(Math.max(30, currentZoom - 10));
});

zoomInBtn.addEventListener('click', () => {
    setZoom(Math.min(150, currentZoom + 10));
});

zoomSlider.addEventListener('input', (e) => {
    setZoom(parseInt(e.target.value));
});

resetZoomBtn.addEventListener('click', () => {
    setZoom(100);
});

zoomAreaTrigger.addEventListener('mouseenter', () => {
    zoomControls.classList.add('visible');
});

zoomControls.addEventListener('mouseleave', () => {
    zoomControls.classList.remove('visible');
});

// Botão de favoritos
btnFavorites.addEventListener('click', (e) => {
    e.stopPropagation();
    showFavoritesModal();
});

// Função para mostrar o modal de favoritos
function showFavoritesModal() {
    updateFavoritesGrid();
    favoritesModal.style.display = 'flex';
}

// Função para atualizar a grade de favoritos
function updateFavoritesGrid() {
    favoritesGrid.innerHTML = '';

    if (favorites.length === 0) {
        const noFavorites = document.createElement('div');
        noFavorites.classList.add('no-favorites');
        noFavorites.textContent = 'No favorites yet. Pin websites using the pin button in webview controls.';
        favoritesGrid.appendChild(noFavorites);
        return;
    }

    favorites.forEach((favorite, index) => {
        const favoriteItem = document.createElement('div');
        favoriteItem.classList.add('favorite-item');
        favoriteItem.dataset.url = favorite.url;

        const icon = document.createElement('img');
        icon.classList.add('favorite-icon');
        icon.src = `https://www.google.com/s2/favicons?domain=${new URL(favorite.url).hostname}`;
        icon.alt = favorite.title;

        const title = document.createElement('div');
        title.classList.add('favorite-title');
        title.textContent = "";
        favoriteItem.appendChild(icon);
        favoriteItem.appendChild(title);
        favoritesGrid.appendChild(favoriteItem);

        favoriteItem.addEventListener('click', () => {
            createTab(favorite.url);
            favoritesModal.style.display = 'none';
        });
    });
}

// Função para adicionar um favorito
function addFavorite(url, title) {
    if (favorites.some(fav => fav.url === url)) {
        return;
    }

    favorites.push({
        url,
        title: title || new URL(url).hostname
    });

    saveFavorites();
    updateFavoritesGrid();
}

// Função para remover um favorito
function removeFavorite(url) {
    favorites = favorites.filter(fav => fav.url !== url);
    saveFavorites();
    updateFavoritesGrid();
}

// Função para salvar favoritos no localStorage
function saveFavorites() {
    localStorage.setItem('browserFavorites', JSON.stringify(favorites));
}

// Função para verificar se uma URL está nos favoritos
function isFavorite(url) {
    return favorites.some(fav => fav.url === url);
}

// Função para aplicar o zoom
function setZoom(zoomLevelValue) {
    currentZoom = zoomLevelValue;
    zoomSlider.value = currentZoom;
    zoomLevel.textContent = `${currentZoom}%`;

    desktop.style.transform = `scale(${currentZoom / 100})`;
    desktop.style.width = `${100 / (currentZoom / 100)}%`;
    desktop.style.height = `${100 / (currentZoom / 100)}%`;
    desktop.style.position = currentZoom === 100 ? 'relative' : 'absolute';

    if (currentZoom !== 100) {
        desktop.style.cursor = 'grab';
        desktop.style.userSelect = 'none';
    } else {
        desktop.style.cursor = '';
        desktop.style.userSelect = '';
    }

    resizeCanvas();
    saveState();
}

// Função para arrastar o desktop com zoom
desktop.addEventListener('mousedown', (e) => {
    if (currentZoom === 100 || e.target !== desktop) return;

    isDraggingDesktop = true;
    startDragX = e.clientX;
    startDragY = e.clientY;
    startScrollLeft = desktopContainer.scrollLeft;
    startScrollTop = desktopContainer.scrollTop;
    desktop.style.cursor = 'grabbing';
    e.preventDefault();
});

window.addEventListener('mousemove', (e) => {
    if (!isDraggingDesktop || currentZoom === 100) return;

    const dx = e.clientX - startDragX;
    const dy = e.clientY - startDragY;

    desktopContainer.scrollLeft = startScrollLeft - dx;
    desktopContainer.scrollTop = startScrollTop - dy;
});

window.addEventListener('mouseup', () => {
    isDraggingDesktop = false;
    if (currentZoom !== 100) {
        desktop.style.cursor = 'grab';
    }
});

// Função para exportar os boards para um arquivo JSON
function exportBoards() {
    const state = {
        boards: {},
        currentBoardId,
        currentZoom,
        nextTabId: tabIdCounter,
        nextTextFieldId: textFieldIdCounter,
        nextListId: listIdCounter,
        nextBoardId: boardIdCounter,
        favorites: favorites,
        drawingData: drawingData
    };

    Object.keys(boards).forEach(boardId => {
        const board = boards[boardId];
        state.boards[boardId] = {
            id: board.id,
            name: board.name,
            activeTabId: board.activeTabId,
            activeTextFieldId: board.activeTextFieldId,
            activeListId: board.activeListId,
            tabs: board.tabs.map(tab => ({
                id: tab.id,
                url: tab.webview.src,
                position: {
                    top: tab.tabFrame.style.top,
                    left: tab.tabFrame.style.left,
                    zIndex: tab.tabFrame.style.zIndex
                },
                size: {
                    width: tab.tabFrame.style.width,
                    height: tab.tabFrame.style.height
                },
                maximized: tab.tabFrame.classList.contains('maximized-tab')
            })),
            textFields: board.textFields.map(textField => ({
                id: textField.id,
                content: textField.textarea.value,
                title: textField.textFieldFrame.querySelector('.title-section').value,
                                                           position: {
                                                               top: textField.textFieldFrame.style.top,
                                                               left: textField.textFieldFrame.style.left,
                                                               zIndex: textField.textFieldFrame.style.zIndex
                                                           },
                                                           size: {
                                                               width: textField.textFieldFrame.style.width,
                                                               height: textField.textFieldFrame.style.height
                                                           },
                                                           maximized: textField.textFieldFrame.classList.contains('maximized-textfield')
            })),
            lists: board.lists.map(list => ({
                id: list.id,
                title: list.listFrame.querySelector('.title-section').value,
                                            items: Array.from(list.listContent.querySelectorAll('.list-item')).map(item => ({
                                                checked: item.querySelector('input[type="checkbox"]').checked,
                                                                                                                            text: item.querySelector('input[type="text"]').value
                                            })),
                                            position: {
                                                top: list.listFrame.style.top,
                                                left: list.listFrame.style.left,
                                                zIndex: list.listFrame.style.zIndex
                                            },
                                            size: {
                                                width: list.listFrame.style.width,
                                                height: list.listFrame.style.height
                                            },
                                            maximized: list.listFrame.classList.contains('maximized-list')
            }))
        };
    });

    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `boards_export_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
}

// Função para mostrar o modal de importação
function showImportModal() {
    importModal.style.display = 'flex';
    importFileName.textContent = 'Nenhum arquivo selecionado';
    btnImportConfirm.disabled = true;
}

// Função para mostrar o modal de renomear
function showRenameModal() {
    renameBoardSelect.innerHTML = '';
    Object.keys(boards).forEach(boardId => {
        const option = document.createElement('option');
        option.value = boardId;
        option.textContent = boards[boardId].name;
        renameBoardSelect.appendChild(option);
    });

    if (renameBoardSelect.options.length > 0) {
        renameBoardInput.value = boards[renameBoardSelect.value].name;
    }

    renameModal.style.display = 'flex';
}

// Event listener para seleção de arquivo de importação
importFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        importFileName.textContent = file.name;
        btnImportConfirm.disabled = false;
    } else {
        importFileName.textContent = 'Nenhum arquivo selecionado';
        btnImportConfirm.disabled = true;
    }
});

// Event listener para confirmar importação
btnImportConfirm.addEventListener('click', () => {
    const file = importFileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const state = JSON.parse(e.target.result);

            if (importOverwriteCheckbox.checked) {
                Object.keys(boards).forEach(boardId => {
                    closeBoard(boardId);
                });
            }

            boardIdCounter = state.nextBoardId || boardIdCounter;
            tabIdCounter = state.nextTabId || tabIdCounter;
            textFieldIdCounter = state.nextTextFieldId || textFieldIdCounter;
            listIdCounter = state.nextListId || listIdCounter;
            currentZoom = state.currentZoom || 100;
            setZoom(currentZoom);

            if (state.favorites) {
                favorites = state.favorites;
                saveFavorites();
            }

            if (state.drawingData) {
                drawingData = state.drawingData;
                localStorage.setItem('drawingData', JSON.stringify(drawingData));
            }

            if (state.boards) {
                Object.keys(state.boards).forEach(boardId => {
                    const savedBoard = state.boards[boardId];

                    if (!boards[boardId]) {
                        boards[boardId] = {
                            id: boardId,
                            name: savedBoard.name,
                            tabs: [],
                            textFields: [],
                            lists: [],
                            activeTabId: savedBoard.activeTabId,
                            activeTextFieldId: savedBoard.activeTextFieldId,
                            activeListId: savedBoard.activeListId
                        };
                        renderBoardTab(boardId, savedBoard.name);
                    }

                    if (savedBoard.tabs) {
                        savedBoard.tabs.forEach(savedTab => {
                            createTab(savedTab.url, savedTab, boardId);
                        });
                    }

                    if (savedBoard.textFields) {
                        savedBoard.textFields.forEach(savedTextField => {
                            createTextField(savedTextField, boardId);
                        });
                    }

                    if (savedBoard.lists) {
                        savedBoard.lists.forEach(savedList => {
                            createList(savedList, boardId);
                        });
                    }
                });
            }

            if (state.currentBoardId && boards[state.currentBoardId]) {
                switchBoard(state.currentBoardId, true);
            }

            importModal.style.display = 'none';
            saveState();

        } catch (error) {
            alert('Erro ao importar arquivo: ' + error.message);
            console.error('Erro ao importar:', error);
        }
    };
    reader.readAsText(file);
});

// Event listener para salvar renomeação
btnSaveRename.addEventListener('click', () => {
    const boardId = renameBoardSelect.value;
    const newName = renameBoardInput.value.trim();

    if (boardId && newName && boards[boardId]) {
        boards[boardId].name = newName;
        renderBoardTab(boardId, newName);
        renameModal.style.display = 'none';
        saveState();
    }
});

// Event listeners para fechar modais
closeModalButtons.forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.style.display = 'none';
        });
    });
});

// Fechar modais ao clicar fora
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.style.display = 'none';
    }
});

// Atualizar input de nome quando selecionar outro board
renameBoardSelect.addEventListener('change', () => {
    if (renameBoardSelect.value && boards[renameBoardSelect.value]) {
        renameBoardInput.value = boards[renameBoardSelect.value].name;
    }
});

function saveState() {
    const state = {
        boards: {},
        currentBoardId,
        currentZoom,
        nextTabId: tabIdCounter,
        nextTextFieldId: textFieldIdCounter,
        nextListId: listIdCounter,
        nextBoardId: boardIdCounter,
        favorites: favorites,
        drawingData: drawingData
    };

    Object.keys(boards).forEach(boardId => {
        const board = boards[boardId];
        state.boards[boardId] = {
            id: board.id,
            name: board.name,
            activeTabId: board.activeTabId,
            activeTextFieldId: board.activeTextFieldId,
            activeListId: board.activeListId,
            tabs: board.tabs.map(tab => ({
                id: tab.id,
                url: tab.webview.src,
                position: {
                    top: tab.tabFrame.style.top,
                    left: tab.tabFrame.style.left,
                    zIndex: tab.tabFrame.style.zIndex
                },
                size: {
                    width: tab.tabFrame.style.width,
                    height: tab.tabFrame.style.height
                },
                maximized: tab.tabFrame.classList.contains('maximized-tab')
            })),
            textFields: board.textFields.map(textField => ({
                id: textField.id,
                content: textField.textarea.value,
                title: textField.textFieldFrame.querySelector('.title-section').value,
                                                           position: {
                                                               top: textField.textFieldFrame.style.top,
                                                               left: textField.textFieldFrame.style.left,
                                                               zIndex: textField.textFieldFrame.style.zIndex
                                                           },
                                                           size: {
                                                               width: textField.textFieldFrame.style.width,
                                                               height: textField.textFieldFrame.style.height
                                                           },
                                                           maximized: textField.textFieldFrame.classList.contains('maximized-textfield')
            })),
            lists: board.lists.map(list => ({
                id: list.id,
                title: list.listFrame.querySelector('.title-section').value,
                                            items: Array.from(list.listContent.querySelectorAll('.list-item')).map(item => ({
                                                checked: item.querySelector('input[type="checkbox"]').checked,
                                                                                                                            text: item.querySelector('input[type="text"]').value
                                            })),
                                            position: {
                                                top: list.listFrame.style.top,
                                                left: list.listFrame.style.left,
                                                zIndex: list.listFrame.style.zIndex
                                            },
                                            size: {
                                                width: list.listFrame.style.width,
                                                height: list.listFrame.style.height
                                            },
                                            maximized: list.listFrame.classList.contains('maximized-list')
            }))
        };
    });

    localStorage.setItem('browserState', JSON.stringify(state));
}

function loadState() {
    const savedState = localStorage.getItem('browserState');
    if (!savedState) {
        createBoard('Board 1', true);
        setZoom(100);
        return;
    }

    try {
        const state = JSON.parse(savedState);
        boardIdCounter = state.nextBoardId || 0;
        tabIdCounter = state.nextTabId || 0;
        textFieldIdCounter = state.nextTextFieldId || 0;
        listIdCounter = state.nextListId || 0;
        currentZoom = state.currentZoom || 100;
        setZoom(currentZoom);

        if (state.favorites) {
            favorites = state.favorites;
            saveFavorites();
        }

        if (state.drawingData) {
            drawingData = state.drawingData;
            localStorage.setItem('drawingData', JSON.stringify(drawingData));
        }

        if (state.boards) {
            Object.keys(state.boards).forEach(boardId => {
                const savedBoard = state.boards[boardId];
                boards[boardId] = {
                    id: boardId,
                    name: savedBoard.name,
                    tabs: [],
                    textFields: [],
                    lists: [],
                    activeTabId: savedBoard.activeTabId,
                    activeTextFieldId: savedBoard.activeTextFieldId,
                    activeListId: savedBoard.activeListId
                };
                renderBoardTab(boardId, savedBoard.name);
            });
        }

        if (state.boards) {
            Object.keys(state.boards).forEach(boardId => {
                const savedBoard = state.boards[boardId];

                if (savedBoard.tabs) {
                    savedBoard.tabs.forEach(savedTab => {
                        createTab(savedTab.url, savedTab, boardId);
                    });
                }

                if (savedBoard.textFields) {
                    savedBoard.textFields.forEach(savedTextField => {
                        createTextField(savedTextField, boardId);
                    });
                }

                if (savedBoard.lists) {
                    savedBoard.lists.forEach(savedList => {
                        createList(savedList, boardId);
                    });
                }
            });
        }

        if (state.currentBoardId && boards[state.currentBoardId]) {
            switchBoard(state.currentBoardId, true);
        } else {
            const firstBoardId = Object.keys(boards)[0];
            if (firstBoardId) switchBoard(firstBoardId, true);
        }
    } catch (e) {
        console.error('Erro ao carregar estado:', e);
        createBoard('Board 1', true);
        setZoom(100);
    }
}

function createBoard(name, isInitial = false) {
    const id = `board-${++boardIdCounter}`;
    boards[id] = {
        id,
        name,
        tabs: [],
        textFields: [],
        lists: [],
        activeTabId: null,
        activeTextFieldId: null,
        activeListId: null
    };

    renderBoardTab(id, name);

    if (isInitial || !currentBoardId) {
        switchBoard(id, true);
    }

    saveState();
    return id;
}

function renderBoardTab(boardId, boardName) {
    const existingTab = document.querySelector(`.board-tab[data-board-id="${boardId}"]`);
    if (existingTab) {
        existingTab.remove();
    }

    const boardTab = document.createElement('button');
    boardTab.classList.add('board-tab');
    boardTab.dataset.boardId = boardId;
    boardTab.title = boardName;
    boardTab.textContent = boardName;
    boardTab.draggable = true;

    if (currentBoardId === boardId) {
        boardTab.classList.add('active');
    }

    boardTab.addEventListener('click', () => {
        switchBoard(boardId);
    });

    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = ' &times;';
    closeBtn.style.marginLeft = '5px';
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeBoard(boardId);
    });
    boardTab.appendChild(closeBtn);

    boardsContainer.appendChild(boardTab);
}

function switchBoard(boardId, initialLoad = false) {
    if (!boards[boardId] || currentBoardId === boardId) return;

    if (currentBoardId && boards[currentBoardId]) {
        const currentBoard = boards[currentBoardId];
        currentBoard.tabs.forEach(tab => {
            tab.tabFrame.style.display = 'none';
        });
        currentBoard.textFields.forEach(textField => {
            textField.textFieldFrame.style.display = 'none';
        });
        currentBoard.lists.forEach(list => {
            list.listFrame.style.display = 'none';
        });
    }

    currentBoardId = boardId;
    const board = boards[boardId];

    board.tabs.forEach(tab => {
        tab.tabFrame.style.display = 'flex';
    });
    board.textFields.forEach(textField => {
        textField.textFieldFrame.style.display = 'flex';
    });
    board.lists.forEach(list => {
        list.listFrame.style.display = 'flex';
    });

    document.querySelectorAll('.board-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.board-tab[data-board-id="${boardId}"]`).classList.add('active');

    activeTabId = board.activeTabId;
    activeTextFieldId = board.activeTextFieldId;
    activeListId = board.activeListId;

    resizeCanvas();
    loadDrawing();

    if (!initialLoad) {
        saveState();
    }
}

function closeBoard(boardId) {
    if (Object.keys(boards).length <= 1) {
        alert('You cannot close the last board.');
        return;
    }

    const board = boards[boardId];
    if (!board) return;

    board.tabs.forEach(tab => {
        tab.tabFrame.remove();
    });
    board.textFields.forEach(textField => {
        textField.textFieldFrame.remove();
    });
    board.lists.forEach(list => {
        list.listFrame.remove();
    });

    delete boards[boardId];

    const boardTab = document.querySelector(`.board-tab[data-board-id="${boardId}"]`);
    if (boardTab) boardTab.remove();

    if (currentBoardId === boardId) {
        const remainingBoardId = Object.keys(boards)[0];
        if (remainingBoardId) {
            switchBoard(remainingBoardId);
        } else {
            createBoard('Board 1', true);
        }
    }

    saveState();
}

function createTab(url = defaultStartPage, savedState = null, targetBoardId = null){
    const boardId = targetBoardId || currentBoardId;
    if (!boardId || !boards[boardId]) return;

    const id = savedState ? savedState.id : ++tabIdCounter;
    if (!savedState) tabIdCounter = Math.max(tabIdCounter, id);

    const tabFrame = document.createElement('div');
    tabFrame.classList.add('tab-frame');

    if (savedState) {
        tabFrame.style.top = savedState.position.top || '50px';
        tabFrame.style.left = savedState.position.left || '50px';
        tabFrame.style.zIndex = savedState.position.zIndex || (100 + id);
        tabFrame.style.width = '600px';
        tabFrame.style.height = '400px';
        if (savedState.maximized) {
            //tabFrame.classList.add('maximized-tab');
        }
    } else {
        tabFrame.style.top = '50px';
        tabFrame.style.left = (50 + boards[boardId].tabs.length * 30) + 'px';
        tabFrame.style.zIndex = 100 + id;
        tabFrame.style.width = '600px';
        tabFrame.style.height = '400px';
    }

    tabFrame.dataset.id = id;

    const header = document.createElement('div');
    header.classList.add('tab-header');
    header.innerHTML = `
    <div class="url-section">
    <input type="url" placeholder="Input the URL or Search..." />
    <div class="suggestions-box"></div>
    </div>
    <div class="controls">
    <button title="Copy Elements" class="btn-copy-elements">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy-icon lucide-copy"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
    </button>
    <button title="Edit as HTML" class="btn-edit-html">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-code-xml-icon lucide-code-xml"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
    </button>
    <button title="Back" class="btn-back">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-reply-icon lucide-reply"><path d="M20 18v-2a4 4 0 0 0-4-4H4"/><path d="m9 17-5-5 5-5"/></svg>
    </button>
    <button title="Forward" class="btn-forward">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-forward-icon lucide-forward"><path d="m15 17 5-5-5-5"/><path d="M4 18v-2a4 4 0 0 1 4-4h12"/></svg>
    </button>
    <button title="Refresh" class="btn-refresh">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rotate-ccw-icon lucide-rotate-ccw"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
    </button>
    <button title="Pin/Unpin" class="btn-pin">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-star-icon lucide-star"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>
    </button>
    <div class="move-to-board-container">
    <button class="btn-move-to-board" title="Move to another board">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-move3d-icon lucide-move-3d"><path d="M5 3v16h16"/><path d="m5 19 6-6"/><path d="m2 6 3-3 3 3"/><path d="m18 16 3 3-3 3"/></svg>
    </button>
    <div class="move-to-board-menu"></div>
    </div>
    <button title="Change size" class="btn-maximize"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-maximize2-icon lucide-maximize-2"><path d="M15 3h6v6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/><path d="M9 21H3v-6"/></svg>
    </button>
    <button title="Close" class="btn-close"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    </button>
    </div>
    `;

    tabFrame.appendChild(header);

    const content = document.createElement('div');
    content.classList.add('tab-content');

    const webview = document.createElement('webview');

    const btnCopyElements = header.querySelector('.btn-copy-elements');

    // Event listener para o botão de cópia - CORRIGIDO
    btnCopyElements.addEventListener('click', (e) => {
        e.stopPropagation();
        isCopyModeActive = !isCopyModeActive;
        btnCopyElements.classList.toggle('active');

        try {
            if (isCopyModeActive) {
                // Ativando modo cópia
                webview.executeJavaScript(`
                try {
                    // Limpa qualquer listener anterior
                    if (window.copyModeHandler) {
                        document.body.removeEventListener('click', window.copyModeHandler, true);
                        delete window.copyModeHandler;
                    }

                    // Define o novo handler
                    function copyModeHandler(e) {
                        e.preventDefault();
                        e.stopPropagation();

                        let textToCopy = '';
                        if (e.target.href) {
                            textToCopy = e.target.href;
                        } else if (e.target.src) {
                            textToCopy = e.target.src;
                        } else {
                            const selection = window.getSelection();
                            if (selection && selection.toString().trim() !== '') {
                                textToCopy = selection.toString();
                            } else {
                                return; // Não copia se não há conteúdo selecionado
                            }
                        }

                        navigator.clipboard.writeText(textToCopy).then(() => {
                            console.log('Copied to clipboard:', textToCopy);
                            // Notifica o modo que uma cópia foi realizada
                            window.postMessage({ type: 'copyCompleted' }, '*');
                        }).catch(err => {
                            console.error('Failed to copy:', err);
                        });
                    }

                    // Armazena o handler globalmente e adiciona o listener
                    window.copyModeHandler = copyModeHandler;
                    document.body.addEventListener('click', copyModeHandler, true);

                    // Muda o cursor para indicar modo cópia
                    document.body.style.cursor = 'copy';
                    const interactiveElements = document.querySelectorAll('a, img, button, input, [contenteditable]');
                    interactiveElements.forEach(el => {
                        el.style.cursor = 'copy';
                    });

                } catch(e) {
                    console.error('Error activating copy mode:', e);
                }
                `).catch(err => {
                    console.error('Failed to activate copy mode:', err);
                    isCopyModeActive = false;
                    btnCopyElements.classList.remove('active');
                });

                //alert('Modo de cópia ativado. Clique em qualquer elemento para copiar seu conteúdo.');

            } else {
                // Desativando modo cópia
                webview.executeJavaScript(`
                try {
                    // Remove o event listener do modo cópia
                    if (window.copyModeHandler) {
                        document.body.removeEventListener('click', window.copyModeHandler, true);
                        delete window.copyModeHandler;
                    }

                    // Restaura o cursor padrão
                    document.body.style.cursor = '';
                    const interactiveElements = document.querySelectorAll('a, img, button, input, [contenteditable]');
                    interactiveElements.forEach(el => {
                        el.style.cursor = '';
                    });

                } catch(e) {
                    console.error('Error deactivating copy mode:', e);
                }
                `).catch(err => {
                    console.error('Failed to deactivate copy mode:', err);
                });

                //alert('Modo de cópia desativado!');
            }

        } catch (err) {
            console.error('Error toggling copy mode:', err);
            isCopyModeActive = false;
            btnCopyElements.classList.remove('active');
        }
    });

    // Listener para quando a cópia for completada
    window.addEventListener('message', (e) => {
        if (e.data.type === 'copyCompleted') {
            isCopyModeActive = false;
            btnCopyElements.classList.remove('active');

            try {
                webview.executeJavaScript(`
                try {
                    if (window.copyModeHandler) {
                        document.body.removeEventListener('click', window.copyModeHandler, true);
                        delete window.copyModeHandler;
                    }
                    document.body.style.cursor = '';
                    const interactiveElements = document.querySelectorAll('a, img, button, input, [contenteditable]');
                    interactiveElements.forEach(el => {
                        el.style.cursor = '';
                    });
                } catch(e) {
                    console.error('Error cleaning up copy mode after completion:', e);
                }
                `).catch(err => {
                    console.error('Failed to clean up copy mode after completion:', err);
                });
            } catch (err) {
                console.error('Error cleaning up copy mode after completion:', err);
            }
        }
    });

    webview.src = savedState ? savedState.url : url;
    webview.setAttribute('allowpopups', '');
    webview.setAttribute('partition', 'persist:trusted');
    webview.setAttribute('webpreferences', 'clipboard-read=yes, clipboard-write=yes');
    webview.style.background = 'white';

    const applyChromeUserAgentIfNeeded = (currentUrl) => {
        if (currentUrl.includes('web.whatsapp.com')) {
            webview.setAttribute('useragent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');
        } else {
            webview.removeAttribute('useragent'); // Volta ao user-agent padrão
        }
    };

    // Aplica no carregamento inicial
    applyChromeUserAgentIfNeeded(savedState ? savedState.url : url);

    // Monitora alterações de URL (navegação dentro do webview)
    webview.addEventListener('did-navigate', (e) => {
        applyChromeUserAgentIfNeeded(e.url);
        addToHistory(e.url);
    });

    // Monitora redirecionamentos (como após login)
    webview.addEventListener('did-navigate-in-page', (e) => {
        if (e.isMainFrame) {
            applyChromeUserAgentIfNeeded(e.url);
        }
    });

    content.appendChild(webview);
    tabFrame.appendChild(content);

    addResizers(tabFrame);

    desktop.appendChild(tabFrame);

    const urlInput = header.querySelector('input[type="url"]');

    const suggestionsBox = header.querySelector('.suggestions-box');

    urlInput.addEventListener('input', (e) => {
        const inputText = e.target.value.toLowerCase().trim();
        suggestionsBox.innerHTML = '';

        if (inputText.length === 0) {
            suggestionsBox.style.display = 'none';
            return;
        }

        // Combina histórico e favoritos em uma única lista, sem duplicatas
        const favoriteUrls = favorites.map(fav => fav.url);
        const allSources = [...new Set([...browsingHistory, ...favoriteUrls])];

        const filtered = allSources.filter(item => item.toLowerCase().includes(inputText));

        // Limita a 10 sugestões para não poluir a tela
        const topResults = filtered.slice(0, 10);

        if (topResults.length > 0) {
            topResults.forEach(suggestionUrl => {
                const item = document.createElement('div');
                item.classList.add('suggestion-item');
                item.textContent = suggestionUrl;
                item.title = suggestionUrl; // Mostra URL completa no hover

                // Evento de clique em uma sugestão
                item.addEventListener('mousedown', (event) => {
                    event.preventDefault(); // Previne que o input perca o foco antes do clique
                    urlInput.value = suggestionUrl;
                    webview.src = suggestionUrl;
                    suggestionsBox.style.display = 'none';
                    saveState();
                });

                suggestionsBox.appendChild(item);
            });
            suggestionsBox.style.display = 'block';
        } else {
            suggestionsBox.style.display = 'none';
        }
    });

    // Esconde a caixa de sugestões quando o input perde o foco
    urlInput.addEventListener('blur', () => {
        // Usamos um pequeno timeout para permitir que o clique no item de sugestão seja registrado
        setTimeout(() => {
            suggestionsBox.style.display = 'none';
        }, 150);
    });

    // Mostra a caixa de sugestões quando o input ganha foco e já tem texto
    urlInput.addEventListener('focus', () => {
        if (urlInput.value.trim().length > 0) {
            // Dispara o evento 'input' para re-filtrar e mostrar as sugestões
            urlInput.dispatchEvent(new Event('input'));
        }
    });
    // **FIM DA LÓGICA DE SUGESTÕES**

    const btnMaximize = header.querySelector('.btn-maximize');
    const btnClose = header.querySelector('.btn-close');
    const btnMoveToBoard = header.querySelector('.btn-move-to-board');
    const moveToBoardMenu = header.querySelector('.move-to-board-menu');
    const goBackBtn = header.querySelector('.btn-back');
    const goForwardBtn = header.querySelector('.btn-forward');
    const refreshBtn = header.querySelector('.btn-refresh');
    const pinBtn = header.querySelector('.btn-pin');
    const btnEditHtml = header.querySelector('.btn-edit-html');

    btnEditHtml.addEventListener('click', async (e) => {
        e.stopPropagation();

        try {
            // Obtém o HTML da página atual
            const html = await webview.executeJavaScript(`
            document.documentElement.outerHTML
            `);

            // Cria um novo campo de texto com o HTML
            const textFieldId = createTextField({
                content: html,
                title: `HTML Export: ${webview.getTitle() || 'Untitled'}`,
                                                position: {
                                                    top: '100px',
                                                    left: '100px',
                                                    zIndex: 200 + textFieldIdCounter
                                                },
                                                size: {
                                                    width: '800px',
                                                    height: '600px'
                                                }
            }, currentBoardId);

            // Adiciona um listener para atualizar o webview quando o texto for alterado
            const textField = boards[currentBoardId].textFields.find(t => t.id === textFieldId);
            const textarea = textField.textarea;

            textarea.addEventListener('input', () => {
                try {
                    // Atualiza o webview com o novo HTML
                    webview.executeJavaScript(`
                    document.open();
                    document.write(\`${textarea.value.replace(/`/g, '\\`')}\`);
                    document.close();
                    `);
                } catch (error) {
                    console.error('Error updating webview:', error);
                }
            });

        } catch (error) {
            console.error('Error exporting HTML:', error);
            alert('Failed to export HTML. The page may have restrictions.');
        }
    });

    function updatePinButton() {
        if (isFavorite(webview.src)) {
            pinBtn.classList.add('pinned');
            pinBtn.title = 'Unpin from favorites';
        } else {
            pinBtn.classList.remove('pinned');
            pinBtn.title = 'Pin to favorites';
        }
    }

    pinBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const url = webview.src;

        if (isFavorite(url)) {
            removeFavorite(url);
        } else {
            addFavorite(url, document.title || new URL(url).hostname);
        }

        updatePinButton();
    });

    webview.addEventListener('did-navigate', (e) => {
        urlInput.value = e.url;
        updatePinButton();
    });

    webview.addEventListener('page-title-updated', (e) => {
        if (isFavorite(webview.src)) {
            const favIndex = favorites.findIndex(fav => fav.url === webview.src);
            if (favIndex !== -1) {
                favorites[favIndex].title = e.title;
                saveFavorites();
                updateFavoritesGrid();
            }
        }
    });

    function updateMoveToBoardMenu() {
        moveToBoardMenu.innerHTML = '';

        Object.keys(boards).forEach(targetBoardId => {
            if (targetBoardId !== boardId) {
                const button = document.createElement('button');
                button.textContent = boards[targetBoardId].name;
                button.addEventListener('click', () => {
                    moveItemToBoard('tab', id, targetBoardId);
                });
                moveToBoardMenu.appendChild(button);
            }
        });
    }

    btnMoveToBoard.addEventListener('click', (e) => {
        e.stopPropagation();
        updateMoveToBoardMenu();
        moveToBoardMenu.style.display = moveToBoardMenu.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', (e) => {
        if (!header.contains(e.target)) {
            moveToBoardMenu.style.display = 'none';
        }
    });

    makeDraggable(tabFrame, header);

    // Event listener principal do tabFrame - CORRIGIDO
    tabFrame.addEventListener('click', (e) => {
        // Verifica se o clique foi no botão de cópia - se sim, não desativa
        if (e.target.closest('.btn-copy-elements')) {
            return;
        }

        // Se o modo cópia estiver ativo e o clique não foi no botão, desativa
        if (isCopyModeActive) {
            isCopyModeActive = false;
            btnCopyElements.classList.remove('active');

            try {
                webview.executeJavaScript(`
                try {
                    if (window.copyModeHandler) {
                        document.body.removeEventListener('click', window.copyModeHandler, true);
                        delete window.copyModeHandler;
                    }
                    document.body.style.cursor = '';
                    const interactiveElements = document.querySelectorAll('a, img, button, input, [contenteditable]');
                    interactiveElements.forEach(el => {
                        el.style.cursor = '';
                    });
                } catch(e) {
                    console.error('Error disabling copy mode from tab click:', e);
                }
                `).catch(err => {
                    console.error('Failed to disable copy mode from tab click:', err);
                });
            } catch (err) {
                console.error('Error disabling copy mode from tab click:', err);
            }
            return;
        }

        // Resto da lógica original do clique no tab...
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.classList.contains('resizer')) return;

        removeAllFocus();
        tabFrame.classList.add('focused');
        urlInput.style.display = 'block';
        urlInput.value = webview.src || url;
        urlInput.focus();
        urlInput.select();

        boards[boardId].activeTabId = id;
        boards[boardId].activeTextFieldId = null;
        boards[boardId].activeListId = null;
        activeTabId = id;
        activeTextFieldId = null;
        activeListId = null;

        saveState();
    });

    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            let newUrl = urlInput.value.trim();
            if (newUrl && !newUrl.includes('.') && !newUrl.startsWith('http')) {
                switch (defaultSearchEngine) {
                    case 'google':
                        newUrl = `https://www.google.com/search?q=${encodeURIComponent(newUrl)}`;
                        break;
                    case 'duckduckgo':
                        newUrl = `https://duckduckgo.com/?q=${encodeURIComponent(newUrl)}`;
                        break;
                    case 'bing':
                        newUrl = `https://www.bing.com/search?q=${encodeURIComponent(newUrl)}`;
                        break;
                    case 'chatgpt':
                        newUrl = `https://chatgpt.com/?q=${encodeURIComponent(newUrl)}`;
                        break;
                }
            } else if (!newUrl.startsWith('http')) {
                newUrl = 'https://' + newUrl;
            }

            if (newUrl) {
                webview.src = newUrl;
                tabFrame.classList.remove('focused');
                saveState();
            }
        }
    });

    urlInput.addEventListener('blur', () => {
        setTimeout(() => {
            tabFrame.classList.remove('focused');
        }, 100);
    });

    btnClose.addEventListener('click', (e) => {
        e.stopPropagation();
        closeTab(id);
        saveState();
    });

    refreshBtn.addEventListener('click', (e) => {
        webview.reload();
    });

    goForwardBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        try {
            if(webview.canGoForward()){
                webview.goForward();
            }
        } catch(error) {}
    });

    goBackBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        try {
            if(webview.canGoBack()){
                webview.goBack();
            }
        } catch(error) {}
    });

    btnMaximize.addEventListener('click', (e) => {
        e.stopPropagation();
        const tab = boards[boardId].tabs.find(t => t.id === id);
        if (tab.tabFrame.classList.contains('maximized-tab')) {
            tab.tabFrame.classList.remove('maximized-tab');
            tab.tabFrame.style.top = savedState?.position?.top || '50px';
            tab.tabFrame.style.left = savedState?.position?.left || '50px';
            tab.tabFrame.style.width = savedState?.size?.width || '600px';
            tab.tabFrame.style.height = savedState?.size?.height || '400px';
            tab.tabFrame.style.borderRadius = '8px';
            tab.tabFrame.style.boxShadow = '0 0 15px rgba(0,0,0,0.7)';
            tab.tabFrame.style.zIndex = savedState?.position?.zIndex || (100 + id);
        } else {
            maximizeTab(id);
        }
        saveState();
    });

    tabFrame.addEventListener('wheel', e => {
        if (e.ctrlKey) {
            e.preventDefault();
            let zoom = webview.getZoomFactor();
            zoom += e.deltaY * -0.0015;
            zoom = Math.min(Math.max(zoom, 0.25), 3);
            webview.setZoomFactor(zoom);
        }
    });

    boards[boardId].tabs.push({ id, tabFrame, webview, minimized: false, url: savedState ? savedState.url : url });

    if (savedState?.maximized) {
        maximizeTab(id);
    }

    if (boardId !== currentBoardId) {
        tabFrame.style.display = 'none';
    }

    updatePinButton();

    return id;
}

function createTextField(savedState = null, targetBoardId = null) {
    const boardId = targetBoardId || currentBoardId;
    if (!boardId || !boards[boardId]) return;

    // Determina se é uma chamada normal ou com configuração completa
    const isConfigObject = savedState && typeof savedState === 'object' && !savedState.id;

    const id = isConfigObject ? ++textFieldIdCounter : (savedState?.id || ++textFieldIdCounter);
    if (!isConfigObject) textFieldIdCounter = Math.max(textFieldIdCounter, id);

    const tabFrame = document.createElement('div');
    tabFrame.classList.add('textfield-frame');

    if (savedState) {
        if (isConfigObject) {
            // Chamada com objeto de configuração completa (do Edit as HTML)
            tabFrame.style.top = savedState.position?.top || '120px';
            tabFrame.style.left = savedState.position?.left || (80 + boards[boardId].textFields.length * 30) + 'px';
            tabFrame.style.zIndex = savedState.position?.zIndex || (200 + id);
            tabFrame.style.width = '600px';
            tabFrame.style.height = '400px';
        } else {
            // Chamada normal com savedState
            tabFrame.style.top = savedState.position?.top || '120px';
            tabFrame.style.left = savedState.position?.left || (80 + boards[boardId].textFields.length * 30) + 'px';
            tabFrame.style.zIndex = savedState.position?.zIndex || (200 + id);
            tabFrame.style.width = '600px';
            tabFrame.style.height = '400px';
            if (savedState.maximized) {
                //tabFrame.classList.add('maximized-textfield');
            }
        }
    } else {
        // Chamada sem parâmetros
        tabFrame.style.top = '120px';
        tabFrame.style.left = (80 + boards[boardId].textFields.length * 30) + 'px';
        tabFrame.style.zIndex = 200 + id;
        tabFrame.style.width = '600px';
        tabFrame.style.height = '400px';
    }

    tabFrame.dataset.id = id;

    const header = document.createElement('div');
    header.classList.add('textfield-header');
    header.innerHTML = `
    <input type='text' class="title-section" value='${
        isConfigObject ?
        (savedState.title || `Campo de Texto #${id}`) :
        (savedState?.title || `Campo de Texto #${id}`)
    }'>
    <div class="controls">
    <div class="move-to-board-container">
    <button class="btn-move-to-board" title="Move to another board">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-move3d-icon lucide-move-3d"><path d="M5 3v16h16"/><path d="m5 19 6-6"/><path d="m2 6 3-3 3 3"/><path d="m18 16 3 3-3 3"/></svg>
    </button>
    <div class="move-to-board-menu"></div>
    </div>
    <button title="Change Size" class="btn-maximize">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-maximize2-icon lucide-maximize-2"><path d="M15 3h6v6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/><path d="M9 21H3v-6"/></svg>
    </button>
    <button title="Close" class="btn-close">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    </button>
    </div>
    `;
    tabFrame.appendChild(header);

    const content = document.createElement('div');
    content.classList.add('textfield-content');
    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Digite seu texto aqui...';

    if (savedState) {
        if (isConfigObject) {
            textarea.value = savedState.content || '';
        } else {
            textarea.value = savedState.content || '';
        }
    }
    content.appendChild(textarea);
    tabFrame.appendChild(content);

    addResizers(tabFrame);

    desktop.appendChild(tabFrame);

    const titleInput = header.querySelector('.title-section');
    const btnMaximize = header.querySelector('.btn-maximize');
    const btnClose = header.querySelector('.btn-close');
    const btnMoveToBoard = header.querySelector('.btn-move-to-board');
    const moveToBoardMenu = header.querySelector('.move-to-board-menu');

    function updateMoveToBoardMenu() {
        moveToBoardMenu.innerHTML = '';

        Object.keys(boards).forEach(targetBoardId => {
            if (targetBoardId !== boardId) {
                const button = document.createElement('button');
                button.textContent = boards[targetBoardId].name;
                button.addEventListener('click', () => {
                    moveItemToBoard('textField', id, targetBoardId);
                });
                moveToBoardMenu.appendChild(button);
            }
        });
    }

    btnMoveToBoard.addEventListener('click', (e) => {
        e.stopPropagation();
        updateMoveToBoardMenu();
        moveToBoardMenu.style.display = moveToBoardMenu.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', (e) => {
        if (!header.contains(e.target)) {
            moveToBoardMenu.style.display = 'none';
        }
    });

    makeDraggable(tabFrame, header);

    titleInput.addEventListener('change', () => {
        saveState();
    });

    textarea.addEventListener('input', () => {
        saveState();
    });

    tabFrame.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.classList.contains('resizer')) return;

        removeAllFocus();

        tabFrame.classList.add('focused');

        boards[boardId].activeTabId = null;
        boards[boardId].activeTextFieldId = id;
        boards[boardId].activeListId = null;
        activeTabId = null;
        activeTextFieldId = id;
        activeListId = null;

        saveState();
    });

    btnClose.addEventListener('click', (e) => {
        e.stopPropagation();
        closeTextField(id);
        saveState();
    });

    btnMaximize.addEventListener('click', (e) => {
        e.stopPropagation();
        const textField = boards[boardId].textFields.find(t => t.id === id);
        if (textField.textFieldFrame.classList.contains('maximized-textfield')) {
            textField.textFieldFrame.classList.remove('maximized-textfield');
            textField.textFieldFrame.style.top = savedState?.position?.top || '80px';
            textField.textFieldFrame.style.left = savedState?.position?.left || (80 + id * 30) + 'px';
            textField.textFieldFrame.style.width = savedState?.size?.width || '600px';
            textField.textFieldFrame.style.height = savedState?.size?.height || '400px';
            textField.textFieldFrame.style.borderRadius = '8px';
            textField.textFieldFrame.style.boxShadow = '0 0 15px rgba(0,0,0,0.7)';
            textField.textFieldFrame.style.zIndex = savedState?.position?.zIndex || (200 + id);
        } else {
            maximizeTextField(id);
        }
        saveState();
    });

    boards[boardId].textFields.push({ id, textFieldFrame: tabFrame, textarea, minimized: false });

    if (savedState?.maximized && !isConfigObject) {
        maximizeTextField(id);
    }

    if (boardId !== currentBoardId) {
        tabFrame.style.display = 'none';
    }

    return id;
}

function createList(savedState = null, targetBoardId = null) {
    const boardId = targetBoardId || currentBoardId;
    if (!boardId || !boards[boardId]) return;

    const id = savedState ? savedState.id : ++listIdCounter;
    if (!savedState) listIdCounter = Math.max(listIdCounter, id);

    const listFrame = document.createElement('div');
    listFrame.classList.add('list-frame');

    if (savedState) {
        listFrame.style.top = savedState.position.top || '110px';
        listFrame.style.left = savedState.position.left || (110 + id * 30) + 'px';
        listFrame.style.zIndex = savedState.position.zIndex || (300 + id);
        listFrame.style.width = '400px';
        listFrame.style.height = '300px';
        if (savedState.maximized) {
            //listFrame.classList.add('maximized-list');
        }
    } else {
        listFrame.style.top = '110px';
        listFrame.style.left = (110 + id * 30) + 'px';
        listFrame.style.zIndex = 300 + id;
        listFrame.style.width = '400px';
        listFrame.style.height = '300px';
    }

    listFrame.dataset.id = id;

    const header = document.createElement('div');
    header.classList.add('list-header');
    header.innerHTML = `
    <input type='text' class="title-section" value='${savedState?.title || `Lista #${id}`}'>
    <div class="controls">
    <div class="move-to-board-container">
    <button class="btn-move-to-board" title="Move to another board">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-move3d-icon lucide-move-3d"><path d="M5 3v16h16"/><path d="m5 19 6-6"/><path d="m2 6 3-3 3 3"/><path d="m18 16 3 3-3 3"/></svg>
    </button>
    <div class="move-to-board-menu"></div>
    </div>
    <button title="Change size" class="btn-maximize"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-maximize2-icon lucide-maximize-2"><path d="M15 3h6v6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/><path d="M9 21H3v-6"/></svg></button>
    <button title="Close" class="btn-close">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    </button>
    </div>
    `;
    listFrame.appendChild(header);

    const content = document.createElement('div');
    content.classList.add('list-content');
    listFrame.appendChild(content);

    if (savedState?.items) {
        savedState.items.forEach(item => {
            addListItem(content, item.checked, item.text);
        });
    } else {
        addListItem(content, false, 'Item 1');
    }

    const addButton = document.createElement('button');
    addButton.classList.add('add-checkbox-btn');
    addButton.textContent = 'New Checkbox';
    addButton.addEventListener('click', () => {
        addListItem(content, false, 'New item');
        saveState();
    });
    content.appendChild(addButton);

    addResizers(listFrame);

    desktop.appendChild(listFrame);

    const titleInput = header.querySelector('.title-section');
    const btnMaximize = header.querySelector('.btn-maximize');
    const btnClose = header.querySelector('.btn-close');
    const btnMoveToBoard = header.querySelector('.btn-move-to-board');
    const moveToBoardMenu = header.querySelector('.move-to-board-menu');

    function updateMoveToBoardMenu() {
        moveToBoardMenu.innerHTML = '';

        Object.keys(boards).forEach(targetBoardId => {
            if (targetBoardId !== boardId) {
                const button = document.createElement('button');
                button.textContent = boards[targetBoardId].name;
                button.addEventListener('click', () => {
                    moveItemToBoard('list', id, targetBoardId);
                });
                moveToBoardMenu.appendChild(button);
            }
        });
    }

    btnMoveToBoard.addEventListener('click', (e) => {
        e.stopPropagation();
        updateMoveToBoardMenu();
        moveToBoardMenu.style.display = moveToBoardMenu.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', (e) => {
        if (!header.contains(e.target)) {
            moveToBoardMenu.style.display = 'none';
        }
    });

    makeDraggable(listFrame, header);

    titleInput.addEventListener('change', () => {
        saveState();
    });

    function setupListItemListeners(item) {
        const checkbox = item.querySelector('input[type="checkbox"]');
        const textInput = item.querySelector('input[type="text"]');
        const deleteBtn = item.querySelector('.delete-item');

        checkbox.addEventListener('change', () => {
            saveState();
        });

        textInput.addEventListener('input', () => {
            saveState();
        });

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            item.remove();
            saveState();
        });
    }

    content.querySelectorAll('.list-item').forEach(item => {
        setupListItemListeners(item);
    });

    listFrame.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.classList.contains('resizer')) return;

        removeAllFocus();

        listFrame.classList.add('focused');

        boards[boardId].activeTabId = null;
        boards[boardId].activeTextFieldId = null;
        boards[boardId].activeListId = id;
        activeTabId = null;
        activeTextFieldId = null;
        activeListId = id;

        saveState();
    });

    btnClose.addEventListener('click', (e) => {
        e.stopPropagation();
        closeList(id);
        saveState();
    });

    btnMaximize.addEventListener('click', (e) => {
        e.stopPropagation();
        const list = boards[boardId].lists.find(l => l.id === id);
        if (list.listFrame.classList.contains('maximized-list')) {
            list.listFrame.classList.remove('maximized-list');
            list.listFrame.style.top = savedState?.position?.top || '110px';
            list.listFrame.style.left = savedState?.position?.left || (110 + id * 30) + 'px';
            list.listFrame.style.width = savedState?.size?.width || '400px';
            list.listFrame.style.height = savedState?.size?.height || '300px';
            list.listFrame.style.borderRadius = '8px';
            list.listFrame.style.boxShadow = '0 0 15px rgba(0,0,0,0.7)';
            list.listFrame.style.zIndex = savedState?.position?.zIndex || (300 + id);
        } else {
            maximizeList(id);
        }
        saveState();
    });

    boards[boardId].lists.push({
        id,
        listFrame,
        listContent: content,
        minimized: false
    });

    if (savedState?.maximized) {
        maximizeList(id);
    }

    if (boardId !== currentBoardId) {
        listFrame.style.display = 'none';
    }

    return id;
}

function moveItemToBoard(type, itemId, targetBoardId) {
    if (!currentBoardId || !boards[currentBoardId] || !boards[targetBoardId]) return;

    const sourceBoard = boards[currentBoardId];
    const targetBoard = boards[targetBoardId];

    let item;
    let savedState;

    if (type === 'tab') {
        item = sourceBoard.tabs.find(t => t.id === itemId);
        if (!item) return;

        savedState = {
            id: item.id,
            url: item.webview.src,
            position: {
                top: item.tabFrame.style.top,
                left: item.tabFrame.style.left,
                zIndex: item.tabFrame.style.zIndex
            },
            size: {
                width: item.tabFrame.style.width,
                height: item.tabFrame.style.height
            },
            maximized: item.tabFrame.classList.contains('maximized-tab')
        };

        sourceBoard.tabs = sourceBoard.tabs.filter(t => t.id !== itemId);
        if (sourceBoard.activeTabId === itemId) {
            sourceBoard.activeTabId = null;
        }

        createTab(savedState.url, savedState, targetBoardId);

    } else if (type === 'textField') {
        item = sourceBoard.textFields.find(t => t.id === itemId);
        if (!item) return;

        savedState = {
            id: item.id,
            content: item.textarea.value,
            title: item.textFieldFrame.querySelector('.title-section').value,
            position: {
                top: item.textFieldFrame.style.top,
                left: item.textFieldFrame.style.left,
                zIndex: item.textFieldFrame.style.zIndex
            },
            size: {
                width: item.textFieldFrame.style.width,
                height: item.textFieldFrame.style.height
            },
            maximized: item.textFieldFrame.classList.contains('maximized-textfield')
        };

        sourceBoard.textFields = sourceBoard.textFields.filter(t => t.id !== itemId);
        if (sourceBoard.activeTextFieldId === itemId) {
            sourceBoard.activeTextFieldId = null;
        }

        createTextField(savedState, targetBoardId);

    } else if (type === 'list') {
        item = sourceBoard.lists.find(l => l.id === itemId);
        if (!item) return;

        savedState = {
            id: item.id,
            title: item.listFrame.querySelector('.title-section').value,
            items: Array.from(item.listContent.querySelectorAll('.list-item')).map(item => ({
                checked: item.querySelector('input[type="checkbox"]').checked,
                                                                                            text: item.querySelector('input[type="text"]').value
            })),
            position: {
                top: item.listFrame.style.top,
                left: item.listFrame.style.left,
                zIndex: item.listFrame.style.zIndex
            },
            size: {
                width: item.listFrame.style.width,
                height: item.listFrame.style.height
            },
            maximized: item.listFrame.classList.contains('maximized-list')
        };

        sourceBoard.lists = sourceBoard.lists.filter(l => l.id !== itemId);
        if (sourceBoard.activeListId === itemId) {
            sourceBoard.activeListId = null;
        }

        createList(savedState, targetBoardId);
    }

    if (item) {
        if (type === 'tab') {
            item.tabFrame.remove();
        } else if (type === 'textField') {
            item.textFieldFrame.remove();
        } else if (type === 'list') {
            item.listFrame.remove();
        }
    }

    saveState();
}

function addListItem(container, checked = false, text = '') {
    const item = document.createElement('div');
    item.classList.add('list-item');
    item.innerHTML = `
    <input type="checkbox" ${checked ? 'checked' : ''}>
    <input type="text" value="${text}">
    <button class="delete-item" title="Remove item">×</button>
    `;
    container.insertBefore(item, container.querySelector('.add-checkbox-btn'));

    const checkbox = item.querySelector('input[type="checkbox"]');
    const textInput = item.querySelector('input[type="text"]');
    const deleteBtn = item.querySelector('.delete-item');

    checkbox.addEventListener('change', () => {
        saveState();
    });

    textInput.addEventListener('input', () => {
        saveState();
    });

    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        item.remove();
        saveState();
    });
}

function addResizers(element) {
    const resizers = ['top', 'right', 'bottom', 'left', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];

    resizers.forEach(direction => {
        const resizer = document.createElement('div');
        resizer.classList.add('resizer', `resizer-${direction}`);
        element.appendChild(resizer);

        resizer.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const startX = e.clientX;
            const startY = e.clientY;
            const startWidth = parseInt(document.defaultView.getComputedStyle(element).width, 10);
            const startHeight = parseInt(document.defaultView.getComputedStyle(element).height, 10);
            const startLeft = parseInt(document.defaultView.getComputedStyle(element).left, 10);
            const startTop = parseInt(document.defaultView.getComputedStyle(element).top, 10);

            function doResize(e) {
                if (direction.includes('right')) {
                    const width = startWidth + (e.clientX - startX);
                    if (width > 300) element.style.width = width + 'px';
                }
                if (direction.includes('bottom')) {
                    const height = startHeight + (e.clientY - startY);
                    if (height > 200) element.style.height = height + 'px';
                }
                if (direction.includes('left')) {
                    const width = startWidth - (e.clientX - startX);
                    if (width > 300) {
                        element.style.width = width + 'px';
                        element.style.left = (startLeft + (e.clientX - startX)) + 'px';
                    }
                }
                if (direction.includes('top')) {
                    const height = startHeight - (e.clientY - startY);
                    if (height > 200) {
                        element.style.height = height + 'px';
                        element.style.top = (startTop + (e.clientY - startY)) + 'px';
                    }
                }
            }

            function stopResize() {
                window.removeEventListener('mousemove', doResize);
                window.removeEventListener('mouseup', stopResize);
                saveState();
            }

            window.addEventListener('mousemove', doResize);
            window.addEventListener('mouseup', stopResize);
        });
    });
}

function removeAllFocus() {
    if (!currentBoardId) return;

    const board = boards[currentBoardId];
    board.tabs.forEach(tab => {
        tab.tabFrame.classList.remove('focused');
        const input = tab.tabFrame.querySelector('input[type="url"]');
    });
    board.textFields.forEach(textField => {
        textField.textFieldFrame.classList.remove('focused');
    });
    board.lists.forEach(list => {
        list.listFrame.classList.remove('focused');
    });

    board.activeTabId = null;
    board.activeTextFieldId = null;
    board.activeListId = null;
    activeTabId = null;
    activeTextFieldId = null;
    activeListId = null;
}

function closeTab(id) {
    if (!currentBoardId) return;

    const board = boards[currentBoardId];
    const tab = board.tabs.find(t => t.id === id);
    if (!tab) return;

    tab.tabFrame.remove();
    board.tabs = board.tabs.filter(t => t.id !== id);

    if (activeTabId === id) {
        activeTabId = null;
        board.activeTabId = null;
    }

    saveState();
}

function closeTextField(id) {
    if (!currentBoardId) return;

    const board = boards[currentBoardId];
    const textField = board.textFields.find(t => t.id === id);
    if (!textField) return;

    textField.textFieldFrame.remove();
    board.textFields = board.textFields.filter(t => t.id !== id);

    if (activeTextFieldId === id) {
        activeTextFieldId = null;
        board.activeTextFieldId = null;
    }

    saveState();
}

function closeList(id) {
    if (!currentBoardId) return;

    const board = boards[currentBoardId];
    const list = board.lists.find(l => l.id === id);
    if (!list) return;

    list.listFrame.remove();
    board.lists = board.lists.filter(l => l.id !== id);

    if (activeListId === id) {
        activeListId = null;
        board.activeListId = null;
    }

    saveState();
}

function maximizeTab(id) {
    if (!currentBoardId) return;

    const board = boards[currentBoardId];
    board.tabs.forEach(t => {
        if (t.id === id) {
            t.tabFrame.classList.add('maximized-tab');
            t.tabFrame.style.top = '0';
            t.tabFrame.style.left = '0';
            t.tabFrame.style.width = '100%';
            t.tabFrame.style.height = '100%';
            t.tabFrame.style.borderRadius = '0';
            t.tabFrame.style.boxShadow = 'none';
            t.tabFrame.style.zIndex = '9999';
        } else {
            t.tabFrame.classList.remove('maximized-tab');
        }
    });

    saveState();
}

function maximizeTextField(id) {
    if (!currentBoardId) return;

    const board = boards[currentBoardId];
    board.textFields.forEach(t => {
        if (t.id === id) {
            t.textFieldFrame.classList.add('maximized-textfield');
            t.textFieldFrame.style.top = '0';
            t.textFieldFrame.style.left = '0';
            t.textFieldFrame.style.width = '100%';
            t.textFieldFrame.style.height = '100%';
            t.textFieldFrame.style.borderRadius = '0';
            t.textFieldFrame.style.boxShadow = 'none';
            t.textFieldFrame.style.zIndex = '9999';
        } else {
            t.textFieldFrame.classList.remove('maximized-textfield');
        }
    });

    saveState();
}

function maximizeList(id) {
    if (!currentBoardId) return;

    const board = boards[currentBoardId];
    board.lists.forEach(l => {
        if (l.id === id) {
            l.listFrame.classList.add('maximized-list');
            l.listFrame.style.top = '0';
            l.listFrame.style.left = '0';
            l.listFrame.style.width = '100%';
            l.listFrame.style.height = '100%';
            l.listFrame.style.borderRadius = '0';
            l.listFrame.style.boxShadow = 'none';
            l.listFrame.style.zIndex = '9999';
        } else {
            l.listFrame.classList.remove('maximized-list');
        }
    });

    saveState();
}

function makeDraggable(element, handle) {
    let isDragging = false;
    let startX, startY, origX, origY;
    let originalZIndex = element.style.zIndex;

    handle.addEventListener('mousedown', e => {
        // Verifica se é um Text Field ou List e se o modo mover está inativo
        const isTextFieldOrList = element.classList.contains('textfield-frame') ||
        element.classList.contains('list-frame') || element.classList.contains('tab-frame');

        if (isTextFieldOrList && !isMoveModeActive) {
            return; // Impede o arrasto se for Text Field/List e o modo mover estiver desligado
        }

        // Permite arrasto apenas no cabeçalho (exceto em inputs/botões)
        if (e.target.tagName === 'INPUT' ||
            e.target.tagName === 'BUTTON' ||
            e.target.classList.contains('resizer')) {
            return;
            }

            isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = element.getBoundingClientRect();
        origX = parseInt(element.style.left) || rect.left;
        origY = parseInt(element.style.top) || rect.top;
        handle.style.cursor = 'grabbing';
        element.classList.add('dragging');
        element.style.zIndex = '10000';
        e.preventDefault();
    });

    function stopDragging() {
        if (isDragging) {
            isDragging = false;
            handle.style.cursor = isMoveModeActive ? 'move' : 'grab';
            element.classList.remove('dragging');
            element.style.zIndex = originalZIndex;
            document.body.classList.remove('item-dragging');
            saveState();
        }
    }

    window.addEventListener('mouseup', stopDragging);
    window.addEventListener('blur', stopDragging);

    window.addEventListener('mousemove', e => {
        if (!isDragging) return;

        let newX = origX + (e.clientX - startX);
        let newY = origY + (e.clientY - startY);

        newX = Math.max(0, Math.min(newX, desktop.offsetWidth - element.offsetWidth));
        newY = Math.max(0, Math.min(newY, desktop.offsetHeight - element.offsetHeight));

        element.style.left = newX + 'px';
        element.style.top = newY + 'px';
    });
}
/*
 d es*ktop.addEventListener('click', e => {
 if (e.target === desktop) {
     removeAllFocus();
     if (isMoveModeActive) {
         btnMoveMode.click();
         }
         }
         });*/

window.addEventListener('beforeunload', () => {
    saveState();
});

// Inicializa o canvas de desenho quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    initDrawingCanvas();
    loadState();
});

window.addEventListener('resize', () => {
    resizeCanvas();
});

// Adiciona listener para a tecla ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // Encontra todos os elementos sendo arrastados
        const draggingElements = document.querySelectorAll('.dragging');

        if (draggingElements.length > 0) {
            // Para cada elemento sendo arrastado, dispara o evento de mouseup
            draggingElements.forEach(element => {
                const event = new MouseEvent('mouseup');
                window.dispatchEvent(event);
            });

            // Sai do modo mover se estiver ativo
            if (isMoveModeActive) {
                btnMoveMode.click();
            }
        }
    }
    else if(e.ctrlKey && e.key === 'b'){
        e.preventDefault();
        createBoard(`Board ${boardIdCounter + 1}`);
    }
    else if(e.ctrlKey && e.key === 'w'){
        e.preventDefault();
        createTab();
    }
    else if(e.ctrlKey && e.key === 't'){
        e.preventDefault();
        createTextField();
    }
    else if(e.ctrlKey && e.key === 'l'){
        e.preventDefault();
        createList();
    }
    else if(e.ctrlKey && e.key === 'r'){
        e.preventDefault();
        showRenameModal();
    }
});

boardsContainer.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('board-tab')) {
        e.target.classList.add('dragging');
        e.dataTransfer.setData('text/plain', e.target.dataset.boardId);
        e.dataTransfer.effectAllowed = 'move';
    }
});

boardsContainer.addEventListener('dragover', (e) => {
    if (e.target.classList.contains('board-tab')) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const draggingElement = document.querySelector('.board-tab.dragging');
        const targetElement = e.target;

        if (draggingElement !== targetElement) {
            const rect = targetElement.getBoundingClientRect();
            const nextElement = (e.clientY > rect.top + rect.height / 2) ?
            targetElement.nextElementSibling :
            targetElement;

            boardsContainer.insertBefore(draggingElement, nextElement);
        }
    }
});

boardsContainer.addEventListener('dragend', (e) => {
    if (e.target.classList.contains('board-tab')) {
        e.target.classList.remove('dragging');
    }
});

boardsContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    const boardId = e.dataTransfer.getData('text/plain');
    const boardTab = document.querySelector(`.board-tab[data-board-id="${boardId}"]`);

    if (boardTab && !e.target.classList.contains('board-tab')) {
        // Se soltar em uma área não válida, não faz nada
        return;
    }

    // Atualiza a ordem no localStorage (opcional, se quiser persistência)
    updateBoardsOrder();
});

function updateBoardsOrder() {
    const boardTabs = Array.from(boardsContainer.querySelectorAll('.board-tab'));
    const newOrder = boardTabs.map(tab => tab.dataset.boardId);

    // Reorganiza o objeto `boards` para refletir a nova ordem
    const reorderedBoards = {};
    newOrder.forEach(id => {
        if (boards[id]) {
            reorderedBoards[id] = boards[id];
        }
    });

    boards = reorderedBoards;
    saveState(); // Salva a nova ordem
}
