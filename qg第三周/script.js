// 默认模型列表
const defaultModels = [
    {
        modelName: "openai",
        modelUrl: "https://chat.openai.com/",
        description: "由OpenAI开发，以强大的自然语言处理能力著称，支持多任务处理，广泛应用于对话、创作和代码生成，代表作为GPT系列模型。"
    },
    {
        modelName: "deepseek",
        modelUrl: "https://chat.deepseek.com/",
        description: "深度求索公司推出的开源大模型，专注高效推理与长文本处理，支持128K上下文，适合代码、数学及复杂逻辑任务。"
    },
    {
        modelName: "腾讯元宝",
        modelUrl: "https://yuanbao.tencent.com/",
        description: "腾讯推出的企业级大模型，强调安全与落地应用，支持多模态交互，适用于金融、医疗等行业场景优化。"
    }
];

// 存储所有模型
let models = [...defaultModels];

// DOM 元素
const modelList = document.getElementById('modelList');
const addModelForm = document.getElementById('addModelForm');
const workspaceContainer = document.getElementById('workspaceContainer');
const addLayerBtn = document.getElementById('addLayerBtn');
const queryForm = document.getElementById('queryForm');

// 初始化模型列表
function initializeModelList() {
    modelList.innerHTML = '';
    models.forEach((model, index) => {
        const modelElement = createModelElement(model, index);
        modelList.appendChild(modelElement);
    });
}

// 创建模型元素
function createModelElement(model, index) {
    const div = document.createElement('div');
    div.className = 'model-item';
    div.draggable = true;
    div.textContent = model.modelName;

    // 点击显示详情
    div.addEventListener('click', () => showModelDetails(model));

    // 拖拽事件
    div.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', index.toString());
        div.classList.add('dragging');
    });

    div.addEventListener('dragend', () => {
        div.classList.remove('dragging');
    });

    return div;
}

// 显示模型详情
function showModelDetails(model) {
    const details = document.createElement('div');
    details.className = 'model-details';
    details.innerHTML = `
        <span class="close-btn">&times;</span>
        <h3>${model.modelName}</h3>
        <p><strong>URL:</strong> ${model.modelUrl}</p>
        <p><strong>描述:</strong> ${model.description}</p>
        <button onclick="deleteModel('${model.modelName}')">删除模型</button>
    `;

    document.body.appendChild(details);
    details.classList.add('active');

    details.querySelector('.close-btn').addEventListener('click', () => {
        details.remove();
    });
}

// 添加新模型
addModelForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const newModel = {
        modelName: document.getElementById('modelName').value,
        modelUrl: document.getElementById('modelUrl').value,
        description: document.getElementById('modelDescription').value
    };

    models.push(newModel);
    initializeModelList();
    addModelForm.reset();
});

// 删除模型
function deleteModel(modelName) {
    models = models.filter(model => model.modelName !== modelName);
    initializeModelList();
    document.querySelector('.model-details').remove();
}

// 添加新层级
addLayerBtn.addEventListener('click', () => {
    const layerNumber = workspaceContainer.children.length + 1;
    const layer = createLayerElement(layerNumber);
    workspaceContainer.appendChild(layer);
});

// 创建层级元素
function createLayerElement(layerNumber) {
    const layer = document.createElement('div');
    layer.className = 'layer';
    layer.innerHTML = `
        <div class="layer-header">
            <h3>层级 ${layerNumber}</h3>
            <div>
                <label>
                    <input type="checkbox" class="parallel-checkbox"> 并行执行
                </label>
                <button onclick="this.parentElement.parentElement.parentElement.remove()">删除层级</button>
            </div>
        </div>
        <div class="layer-content" ondrop="drop(event)" ondragover="allowDrop(event)"></div>
    `;

    return layer;
}

// 拖放功能
function allowDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.add('drop-target');
}

function drop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('drop-target');

    const modelIndex = event.dataTransfer.getData('text/plain');
    const model = models[parseInt(modelIndex)];
    const layerContent = event.currentTarget;

    const modelElement = createModelElement(model, modelIndex);
    layerContent.appendChild(modelElement);
}

// 检查服务器连接
async function checkServerConnection() {
    try {
        const response = await fetch('http://localhost:3000/api', {
            method: 'OPTIONS'
        });
        return response.ok;
    } catch (error) {
        console.error('服务器连接失败:', error);
        return false;
    }
}

// 提交查询
queryForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 检查服务器连接
    const isServerConnected = await checkServerConnection();
    if (!isServerConnected) {
        alert('无法连接到服务器，请确保后端服务器已启动！');
        return;
    }

    const queryData = {
        content: document.getElementById('queryContent').value,
        image: '',
        modelList: []
    };

    // 处理图片上传
    const imageFile = document.getElementById('imageUpload').files[0];
    if (imageFile) {
        queryData.image = await convertImageToBase64(imageFile);
    }

    // 收集层级信息
    const layers = workspaceContainer.children;
    if (layers.length === 0) {
        alert('请至少添加一个层级并拖入模型！');
        return;
    }

    Array.from(layers).forEach((layer, index) => {
        const parallel = layer.querySelector('.parallel-checkbox').checked;
        const layerModels = Array.from(layer.querySelector('.layer-content').children).map(modelEl => {
            const modelIndex = parseInt(modelEl.getAttribute('data-index'));
            return {
                ...models[modelIndex],
                weight: 1
            };
        });

        if (layerModels.length === 0) {
            alert(`层级 ${index + 1} 中没有添加任何模型！`);
            return;
        }

        queryData.modelList.push({
            layer: index + 1,
            parallel: parallel ? 1 : 0,
            models: layerModels
        });
    });

    // 发送到服务器
    try {
        const response = await fetch('http://localhost:3000/api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(queryData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('服务器响应:', result);
        alert('查询提交成功！');
    } catch (error) {
        console.error('提交失败:', error);
        alert('提交失败，请检查服务器是否正常运行！');
    }
});

// 图片转Base64
function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// 初始化
initializeModelList();
