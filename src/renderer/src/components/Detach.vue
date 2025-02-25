<template>
    <div class="info">
    <!-- <img :src="plugInfo.logo"/> -->
    <span>rubick 系统菜单</span>
    </div>
    <div class="handle-container">
    <div class="handle">
        <div class="devtool" @click="openDevTool" title="开发者工具"></div>
    </div>
    <div class="window-handle" v-if="process.platform !== 'darwin'">
        <div class="minimize" @click="minimize"></div>
        <div class="maximize" @click="maximize"></div>
        <div class="close" @click="close"></div>
    </div>
</div>
</template>
<script setup>
const { ipcRenderer } = window.require('electron');
const openDevTool = () => {
  ipcRenderer.send('msg-trigger', { type: 'openPluginDevTools' });
};

const minimize = () => {
  ipcRenderer.send('detach:service', { type: 'minimize' });
};

const maximize = () => {
  ipcRenderer.send('detach:service', { type: 'maximize' });
};

const close = () => {
  ipcRenderer.send('detach:service', { type: 'close' });
};
</script>
<style>
.window-handle > div:hover {
  background-color: #dee2e6;
}

.window-handle .minimize {
  background: center / 20px no-repeat url("../assets/minimize.svg");
}

.window-handle .maximize {
  background: center / 20px no-repeat url("../assets/maximize.svg");
}

.window-handle .unmaximize {
  background: center / 20px no-repeat url("../assets/unmaximize.svg");
}

.window-handle .close {
  background: center / 20px no-repeat url("../assets/close.svg");
}

.window-handle .close:hover {
  background-color: #e53935 !important;
  background-image: url("../assets/close-hover.svg") !important;
}
</style>