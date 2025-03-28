// DOM元素获取
const noteTitle = document.getElementById('note-title');
const noteContent = document.getElementById('note-content');
const noteSubmit = document.getElementById('note-submit');
const todoList = document.getElementById('todo-list');
const btnAll = document.getElementById('btn-all');
const langZh = document.getElementById('lang-zh');
const filterAll = document.getElementById('filter-all');
const filterRecyclebin = document.getElementById('filter-recyclebin');
const filterCompleted = document.getElementById('filter-completed');
const clearAll = document.getElementById('clear-all');
const exportData = document.getElementById('export-data');
const importData = document.getElementById('import-data');
const starButton = document.querySelector('.star-btn');
const editModal = document.getElementById('edit-modal');
const closeModal = document.querySelector('.close-modal');
const editTitle = document.getElementById('edit-title');
const editContent = document.getElementById('edit-content');
const saveEdit = document.getElementById('save-edit');

// 应用数据
let notes = JSON.parse(localStorage.getItem('notes')) || []; // 存储所有笔记
let deletedNotes = JSON.parse(localStorage.getItem('deletedNotes')) || []; // 存储已删除的笔记(回收站)
let currentFilter = 'all'; // 当前筛选模式: 'all'-全部, 'completed'-已完成, 'recyclebin'-回收站
let currentLang = 'zh'; // 当前语言: 'zh'-中文, 'en'-英文
let currentEditId = null; // 当前正在编辑的笔记ID



// 函数定义

/**
 * 保存笔记数据到本地存储
 * 将当前的笔记和回收站数据保存到localStorage
 */
function saveNotes() {
    localStorage.setItem('notes', JSON.stringify(notes));
    localStorage.setItem('deletedNotes', JSON.stringify(deletedNotes));
}

/**
 * 渲染笔记列表
 * 根据当前筛选模式显示相应的笔记列表
 */
function renderNotes() {
    todoList.innerHTML = '';

    let notesToRender = [];

    // 根据当前筛选模式选择要渲染的笔记
    if (currentFilter === 'all') {
        notesToRender = notes;
    } else if (currentFilter === 'completed') {
        notesToRender = notes.filter(note => note.completed);
    } else if (currentFilter === 'recyclebin') {
        notesToRender = deletedNotes;
    }

    // 如果没有笔记，显示空消息
    if (notesToRender.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = currentFilter === 'recyclebin'
            ? translations[currentLang].noDeletedNotes
            : translations[currentLang].noNotes;
        todoList.appendChild(emptyMessage);
        return;
    }

    // 遍历笔记并创建笔记元素
    notesToRender.forEach((note) => {
        const noteItem = document.createElement('div');
        noteItem.className = 'todo-item';
        if (note.completed) noteItem.classList.add('completed');

        // 创建笔记头部(标题和控制按钮)
        const noteHeader = document.createElement('div');
        noteHeader.className = 'todo-header';

        // 如果不是在回收站，添加复选框
        if (currentFilter !== 'recyclebin') {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'todo-checkbox';
            checkbox.checked = note.completed;
            checkbox.addEventListener('change', () => {
                notes[notes.findIndex(n => n.id === note.id)].completed = checkbox.checked;
                saveNotes();
                renderNotes();
            });
            noteHeader.appendChild(checkbox);
        }

        // 添加笔记标题
        const noteTitle = document.createElement('div');
        noteTitle.className = 'todo-title';
        noteTitle.textContent = note.title;
        noteHeader.appendChild(noteTitle);

        // 创建按钮容器
        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'todo-buttons';

        // 如果不是在回收站，添加编辑按钮
        if (currentFilter !== 'recyclebin') {
            const editBtn = document.createElement('button');
            editBtn.className = 'todo-edit';
            editBtn.innerHTML = '✎';
            editBtn.addEventListener('click', () => {
                openEditModal(note);
            });
            buttonsDiv.appendChild(editBtn);
        }

        // 添加删除按钮
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'todo-delete';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.addEventListener('click', () => {
            if (currentFilter === 'recyclebin') {
                if (confirm('确定要永久删除此笔记吗？')) {
                    deletedNotes = deletedNotes.filter(n => n.id !== note.id);
                    saveNotes();
                    renderNotes();
                }
            } else {
                const noteIndex = notes.findIndex(n => n.id === note.id);
                const deletedNote = notes.splice(noteIndex, 1)[0];
                deletedNotes.push(deletedNote);
                saveNotes();
                renderNotes();
            }
        });
        buttonsDiv.appendChild(deleteBtn);

        // 如果在回收站中，添加恢复按钮
        if (currentFilter === 'recyclebin') {
            const restoreBtn = document.createElement('button');
            restoreBtn.className = 'todo-edit';
            restoreBtn.innerHTML = '↩';
            restoreBtn.title = '恢复笔记';
            restoreBtn.addEventListener('click', () => {
                const noteIndex = deletedNotes.findIndex(n => n.id === note.id);
                const restoredNote = deletedNotes.splice(noteIndex, 1)[0];
                notes.unshift(restoredNote); // 添加到数组开头(最新笔记位置)
                saveNotes();
                renderNotes();
            });
            buttonsDiv.appendChild(restoreBtn);
        }

        noteHeader.appendChild(buttonsDiv);
        noteItem.appendChild(noteHeader);

        // 创建笔记内容
        const noteContentDiv = document.createElement('div');
        noteContentDiv.className = 'todo-content';
        noteContentDiv.textContent = note.content;
        noteItem.appendChild(noteContentDiv);

        todoList.appendChild(noteItem);
    });
}

/**
 * 添加新笔记
 * @param {string} title - 笔记标题
 * @param {string} content - 笔记内容
 */
function addNote(title, content) {
    if (title.trim() === '' && content.trim() === '') return;

    const newNote = {
        id: Date.now(),
        title: title || '(无标题)',
        content: content,
        completed: false,
        createdAt: new Date().toISOString()
    };

    notes.unshift(newNote); // 添加到数组开头(置顶)
    saveNotes();
    renderNotes();
    noteTitle.value = '';
    noteContent.value = '';
}

/**
 * 打开编辑模态框
 * @param {Object} note - 要编辑的笔记对象
 */
function openEditModal(note) {
    editTitle.value = note.title;
    editContent.value = note.content;
    currentEditId = note.id;
    editModal.style.display = 'flex';
}

/**
 * 关闭编辑模态框
 */
function closeEditModal() {
    editModal.style.display = 'none';
    currentEditId = null;
}

/**
 * 保存已编辑的笔记
 */
function saveEditedNote() {
    if (currentEditId === null) return;

    const index = notes.findIndex(note => note.id === currentEditId);
    if (index !== -1) {
        notes[index].title = editTitle.value || '(无标题)';
        notes[index].content = editContent.value;
        notes[index].updatedAt = new Date().toISOString();
        saveNotes();
        renderNotes();
    }

    closeEditModal();
}



// 提交新笔记
noteSubmit.addEventListener('click', () => {
    addNote(noteTitle.value, noteContent.value);
});

// 标题输入回车自动跳转到内容
noteTitle.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        noteContent.focus();
    }
});

// 一键标记所有笔记为已完成
btnAll.addEventListener('click', () => {
    notes = notes.map(note => ({ ...note, completed: true }));
    saveNotes();
    renderNotes();
});

// 切换到英文
langEn.addEventListener('click', (e) => {
    e.preventDefault();
    updateLanguage('en');
});

// 切换到中文
langZh.addEventListener('click', (e) => {
    e.preventDefault();
    updateLanguage('zh');
});

// 筛选：显示所有笔记
filterAll.addEventListener('click', (e) => {
    e.preventDefault();
    currentFilter = 'all';
    document.querySelectorAll('.sidebar-links a').forEach(a => a.classList.remove('active'));
    filterAll.classList.add('active');
    renderNotes();
});

// 筛选：显示回收站笔记
filterRecyclebin.addEventListener('click', (e) => {
    e.preventDefault();
    currentFilter = 'recyclebin';
    document.querySelectorAll('.sidebar-links a').forEach(a => a.classList.remove('active'));
    filterRecyclebin.classList.add('active');
    renderNotes();
});

// 筛选：显示已完成笔记
filterCompleted.addEventListener('click', (e) => {
    e.preventDefault();
    currentFilter = 'completed';
    document.querySelectorAll('.sidebar-links a').forEach(a => a.classList.remove('active'));
    filterCompleted.classList.add('active');
    renderNotes();
});

// 清除所有笔记
clearAll.addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('确定要清除所有笔记吗？')) {
        notes = [];
        saveNotes();
        renderNotes();
    }
});

// 关闭编辑模态框
closeModal.addEventListener('click', closeEditModal);

// 点击模态框外部关闭模态框
window.addEventListener('click', (e) => {
    if (e.target === editModal) {
        closeEditModal();
    }
});

// 保存编辑的笔记
saveEdit.addEventListener('click', saveEditedNote);

// 导出笔记数据
exportData.addEventListener('click', (e) => {
    e.preventDefault();
    const dataStr = JSON.stringify({ notes, deletedNotes });
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportLink = document.createElement('a');
    exportLink.setAttribute('href', dataUri);
    exportLink.setAttribute('download', 'notes-data.json');
    document.body.appendChild(exportLink);
    exportLink.click();
    document.body.removeChild(exportLink);
});

// 导入笔记数据
importData.addEventListener('click', (e) => {
    e.preventDefault();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.txt';

    input.onchange = (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = (fileEvent) => {
            try {
                const data = JSON.parse(fileEvent.target.result);
                if (data.notes) {
                    notes = data.notes;
                }
                if (data.deletedNotes) {
                    deletedNotes = data.deletedNotes;
                }
                saveNotes();
                renderNotes();
            } catch (e) {
                alert('无效的文件格式');
                console.error(e);
            }
        };

        reader.readAsText(file);
    };

    input.click();
});

// 初始化应用
updateLanguage(currentLang);
renderNotes(); 