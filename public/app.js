document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('drawingCanvas');
    const ctx = canvas.getContext('2d');
    const socket = io();

    // 工具按钮
    const tools = {
        pencil: document.getElementById('pencil'),
        brush: document.getElementById('brush'),
        marker: document.getElementById('marker'),
        eraser: document.getElementById('eraser')
    };

    // 颜色和大小控制
    const colorPicker = document.getElementById('colorPicker');
    const sizeSlider = document.getElementById('sizeSlider');
    const clearButton = document.getElementById('clear');

    // 绘画状态
    let isDrawing = false;
    let currentTool = 'pencil';
    let lastX = 0;
    let lastY = 0;

    // 设置画布大小
    function resizeCanvas() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }

    // 初始化画布大小
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 工具切换
    Object.entries(tools).forEach(([name, button]) => {
        button.addEventListener('click', () => {
            // 移除所有工具的active类
            Object.values(tools).forEach(btn => btn.classList.remove('active'));
            // 添加当前工具的active类
            button.classList.add('active');
            currentTool = name;
        });
    });

    // 绘画样式设置
    function setDrawingStyle() {
        ctx.strokeStyle = currentTool === 'eraser' ? '#ffffff' : colorPicker.value;
        ctx.lineWidth = sizeSlider.value;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // 根据不同工具设置不同的样式
        switch(currentTool) {
            case 'brush':
                ctx.globalAlpha = 0.6;
                ctx.lineWidth = sizeSlider.value * 1.5;
                break;
            case 'marker':
                ctx.globalAlpha = 0.8;
                ctx.lineWidth = sizeSlider.value * 1.2;
                break;
            default:
                ctx.globalAlpha = 1;
        }
    }

    // 绘画函数
    function draw(e) {
        if (!isDrawing) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;

        setDrawingStyle();
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();

        // 发送绘画数据到服务器
        socket.emit('draw', {
            x0: lastX,
            y0: lastY,
            x1: x,
            y1: y,
            tool: currentTool,
            color: colorPicker.value,
            size: sizeSlider.value
        });

        [lastX, lastY] = [x, y];
    }

    // 鼠标/触摸事件处理
    function startDrawing(e) {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        lastX = (e.clientX || e.touches[0].clientX) - rect.left;
        lastY = (e.clientY || e.touches[0].clientY) - rect.top;
    }

    function stopDrawing() {
        isDrawing = false;
    }

    // 添加事件监听器
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // 触摸屏支持
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startDrawing(e);
    });
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        draw(e);
    });
    canvas.addEventListener('touchend', stopDrawing);

    // 清空画布
    clearButton.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        socket.emit('clear');
    });

    // 接收其他用户的绘画数据
    socket.on('draw', (data) => {
        ctx.beginPath();
        ctx.strokeStyle = data.tool === 'eraser' ? '#ffffff' : data.color;
        ctx.lineWidth = data.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        switch(data.tool) {
            case 'brush':
                ctx.globalAlpha = 0.6;
                ctx.lineWidth = data.size * 1.5;
                break;
            case 'marker':
                ctx.globalAlpha = 0.8;
                ctx.lineWidth = data.size * 1.2;
                break;
            default:
                ctx.globalAlpha = 1;
        }

        ctx.moveTo(data.x0, data.y0);
        ctx.lineTo(data.x1, data.y1);
        ctx.stroke();
    });

    // 接收清空画布命令
    socket.on('clear', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
});
