// ==UserScript==

// @name         iKuuu 账户管理助手（v6.8 - 完整功能修复版）

// @namespace    http://tampermonkey.net/

// @version      6.8

// @description  右上角账户管理 + 自动登录/签到（每账户每日仅一次）+ 多账户循环

// @author       Qwen

// @match        https://ikuuu.de/*

// @grant        GM_getValue

// @grant        GM_setValue

// @grant        GM_xmlhttpRequest

// @grant        GM_addStyle

// @run-at       document-end

// ==/UserScript==

(function () {

    'use strict';

    // ========================

    // 🔒 防止重复注入

    // ========================

    if (window.ikuuuAutoLoopRunning) {

        console.log('🚫 iKuuu 助手已加载，跳过重复注入');

        return;

    }

    window.ikuuuAutoLoopRunning = true;

    

    console.log('🚀 iKuuu 账户管理助手 v6.8 开始加载...');

    // ========================

    // 🎨 添加全局样式

    // ========================

    GM_addStyle(`

        .ik-account-btn {

            position: fixed !important;

            top: 200px !important;

            right: 20px !important;

            width: 40px !important;

            height: 40px !important;

            border-radius: 50% !important;

            background: #4a6fa5 !important;

            color: white !important;

            border: none !important;

            cursor: pointer !important;

            z-index: 99999 !important;

            box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;

            font-size: 20px !important;

            display: flex !important;

            align-items: center !important;

            justify-content: center !important;

            transition: all 0.3s ease !important;

        }

        

        .ik-account-btn:hover {

            transform: scale(1.1) !important;

            box-shadow: 0 6px 20px rgba(0,0,0,0.3) !important;

        }

        

        .account-count {

            position: absolute !important;

            top: -5px !important;

            right: -5px !important;

            background: #e74c3c !important;

            color: white !important;

            border-radius: 50% !important;

            width: 18px !important;

            height: 18px !important;

            font-size: 11px !important;

            display: flex !important;

            align-items: center !important;

            justify-content: center !important;

        }

        

        .ik-account-panel {

            position: fixed !important;

            top: 70px !important;

            right: 20px !important;

            width: 320px !important;

            background: white !important;

            border-radius: 12px !important;

            box-shadow: 0 10px 40px rgba(0,0,0,0.2) !important;

            z-index: 10000 !important;

            overflow: hidden !important;

            border: 1px solid #e1e5e9 !important;

            font-family: 'Segoe UI', system-ui, sans-serif !important;

        }

        

        #ikuuu-log {

            position: fixed !important;

            top: 0px !important;

            right: 100px !important;

            width: 200px !important;

            background: white !important;

            border-radius: 8px !important;

            padding: 12px !important;

            font-size: 12px !important;

            color: #333 !important;

            box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;

            z-index: 99998 !important;

            max-height: 200px !important;

            overflow-y: auto !important;

            border: 1px solid #e1e5e9 !important;

        }

        

        /* 开关样式 */

        .auto-toggle {

            position: relative;

            display: inline-block;

            width: 44px;

            height: 24px;

        }

        

        .auto-toggle input {

            opacity: 0;

            width: 0;

            height: 0;

        }

        

        .auto-toggle .slider {

            position: absolute;

            cursor: pointer;

            top: 0;

            left: 0;

            right: 0;

            bottom: 0;

            background-color: #ccc;

            transition: .4s;

            border-radius: 24px;

        }

        

        .auto-toggle .slider:before {

            position: absolute;

            content: "";

            height: 18px;

            width: 18px;

            left: 3px;

            bottom: 3px;

            background-color: white;

            transition: .4s;

            border-radius: 50%;

        }

        

        .auto-toggle input:checked + .slider {

            background: linear-gradient(135deg, #4a6fa5, #2c3e50);

        }

        

        .auto-toggle input:checked + .slider:before {

            transform: translateX(20px);

        }

        

        /* 按钮悬停效果 */

        .ik-btn {

            transition: all 0.2s ease !important;

        }

        

        .ik-btn:hover {

            transform: translateY(-1px) !important;

            filter: brightness(1.1) !important;

        }

        

        .ik-btn:active {

            transform: translateY(0) !important;

        }

    `);

    // ========================

    // 📝 日志系统

    // ========================

    class LogManager {

        constructor() {

            this.init();

        }

        init() {

            this.createLogContainer();

        }

        createLogContainer() {

            if (document.getElementById('ikuuu-log')) {

                console.log('✅ 日志容器已存在');

                return;

            }

            const logDiv = document.createElement('div');

            logDiv.id = 'ikuuu-log';

            document.body.appendChild(logDiv);

            console.log('✅ 日志容器已创建');

        }

        add(message) {

            const logDiv = document.getElementById('ikuuu-log');

            if (!logDiv) {

                console.error('❌ 日志容器不存在');

                return;

            }

            const timestamp = new Date().toLocaleTimeString('zh-CN', { 

                hour12: false,

                hour: '2-digit',

                minute: '2-digit',

                second: '2-digit'

            });

            const entry = document.createElement('div');

            entry.style.cssText = `

                margin-bottom: 4px;

                padding: 4px 6px;

                border-radius: 4px;

                background: #f8f9fa;

                border-left: 3px solid #3498db;

                font-size: 11px;

                line-height: 1.4;

            `;

            // 根据消息内容设置颜色

            let color = '#3498db'; // 默认蓝色

            if (message.includes('✅') || message.includes('成功')) {

                color = '#27ae60';

                entry.style.background = '#eafaf1';

            } else if (message.includes('❌') || message.includes('错误') || message.includes('失败')) {

                color = '#e74c3c';

                entry.style.background = '#fdeded';

            } else if (message.includes('⚠️') || message.includes('警告')) {

                color = '#f39c12';

                entry.style.background = '#fef9e7';

            } else if (message.includes('⏭️') || message.includes('跳过')) {

                color = '#95a5a6';

                entry.style.background = '#f8f9fa';

            }

            entry.style.borderLeftColor = color;

            entry.innerHTML = `<span style="color: ${color}; font-weight: 500;">[${timestamp}] ${message}</span>`;

            logDiv.appendChild(entry);

            logDiv.scrollTop = logDiv.scrollHeight;

            // 同时输出到控制台

            console.log(`[iKuuu] ${message}`);

        }

    }

    const logger = new LogManager();

    // ========================

    // 🧰 辅助函数

    // ========================

    const getCurrentIndex = () => parseInt(GM_getValue('ikuuuCurrentIndex', '0'));

    const getAccounts = () => {

        try {

            return JSON.parse(GM_getValue('ikuuuAccounts', '[]'));

        } catch (error) {

            logger.add('❌ 读取账户数据失败，使用空数组');

            return [];

        }

    };

    const saveAccounts = (accounts) => GM_setValue('ikuuuAccounts', JSON.stringify(accounts));

    const isAutoEnabled = () => GM_getValue('ikuuuAutoLogin', 'false') === 'true';

    const setAutoEnabled = (enabled) => GM_setValue('ikuuuAutoLogin', enabled.toString());

    // 获取今日日期字符串（YYYY-MM-DD）

    const getToday = () => new Date().toISOString().split('T')[0];

    // 检查账户今天是否已签到

    const hasCheckedInToday = (email) => {

        const key = `ikuuu_checkin_${email.replace(/[@.]/g, '_')}`;

        return GM_getValue(key, '') === getToday();

    };

    // 标记账户今日已签到

    const markCheckedInToday = (email) => {

        const key = `ikuuu_checkin_${email.replace(/[@.]/g, '_')}`;

        GM_setValue(key, getToday());

    };

    // 清除今日签到记录（用于测试）

    const clearCheckinRecords = () => {

        const accounts = getAccounts();

        accounts.forEach(account => {

            const key = `ikuuu_checkin_${account.email.replace(/[@.]/g, '_')}`;

            GM_setValue(key, '');

        });

        logger.add('✅ 已清除所有签到记录');

    };

    // ========================

    // ✅ API 签到函数

    // ========================

    const performCheckinViaAPI = (email) => {

        return new Promise((resolve, reject) => {

            if (hasCheckedInToday(email)) {

                resolve({ success: false, message: "今日已签到（本地记录）", skipped: true, localRecord: true });

                return;

            }

            GM_xmlhttpRequest({

                method: "POST",

                url: "https://ikuuu.de/user/checkin",

                headers: {

                    "Content-Type": "application/json",

                    "X-Requested-With": "XMLHttpRequest"

                },

                data: JSON.stringify({}),

                onload: function (response) {

                    try {

                        const result = JSON.parse(response.responseText);

                        console.log('📡 API签到响应:', result);

                        

                        if (result.ret === 1 || (result.msg && result.msg.includes("签到成功"))) {

                            markCheckedInToday(email);

                            resolve({ success: true, message: result.msg || "签到成功" });

                        } else if (result.msg && (result.msg.includes("已签到") || result.msg.includes("已经"))) {

                            markCheckedInToday(email);

                            resolve({ success: false, message: result.msg, skipped: true, localRecord: false });

                        } else {

                            resolve({ success: false, message: result.msg || "签到失败" });

                        }

                    } catch (e) {

                        console.error('❌ 响应解析失败:', e, response.responseText);

                        resolve({ success: false, message: "响应解析失败" });

                    }

                },

                onerror: function (error) {

                    console.error('❌ 网络请求失败:', error);

                    reject(new Error("网络请求失败"));

                },

                timeout: 10000

            });

        });

    };

    // ========================

    // 🔄 处理下一个账户

    // ========================

    const processNextAccount = () => {

        const accounts = getAccounts();

        const currentIndex = getCurrentIndex();

        

        // 计算下一个账户索引

        const nextIndex = currentIndex + 1;

        

        if (nextIndex < accounts.length) {

            // 还有下一个账户，切换到下一个

            GM_setValue('ikuuuCurrentIndex', nextIndex.toString());

            logger.add(`➡️ 切换到账户 ${nextIndex + 1}/${accounts.length}`);

            logger.add('正在退出...');

            

            // 延迟退出，确保日志显示

            setTimeout(() => {

                const logoutLink = document.querySelector('a[href="/user/logout"], a[href*="logout"]');

                if (logoutLink) {

                    logoutLink.click();

                } else {

                    window.location.href = '/user/logout';

                }

            }, 1000);

        } else {

            // 所有账户处理完成

            GM_setValue('ikuuuCurrentIndex', '0');

            logger.add('✅ 所有账户签到完成（本轮结束）');

        }

    };

    // ========================

    // 🎮 手动签到函数

    // ========================

    const handleManualSign = async () => {

        const accounts = getAccounts();

        const currentIndex = getCurrentIndex();

        if (currentIndex >= accounts.length) {

            alert('没有可用账户！');

            return;

        }

        const email = accounts[currentIndex].email;

        logger.add(`手动触发签到: ${email}`);

        try {

            const result = await performCheckinViaAPI(email);

            if (result.success) {

                logger.add(`✅ 手动签到成功: ${result.message}`);

            } else if (result.skipped) {

                logger.add(`ℹ️ ${result.message}`);

            } else {

                logger.add(`⚠️ 手动签到失败: ${result.message}`);

            }

        } catch (err) {

            logger.add(`❌ 手动签到出错: ${err.message}`);

        }

    };

    // ========================

    // 🔁 自动流程控制

    // ========================

    const handleLoginPage = () => {

        console.log('🔐 处理登录页面...');

        

        setTimeout(() => {

            if (!isAutoEnabled()) {

                logger.add('自动登录已禁用');

                return;

            }

            

            const accounts = getAccounts();

            const idx = getCurrentIndex();

            if (accounts.length === 0) {

                logger.add('⚠️ 没有配置账户');

                return;

            }

            if (idx >= accounts.length) {

                logger.add('所有账户已完成，重置索引');

                GM_setValue('ikuuuCurrentIndex', '0');

                return;

            }

            const { email, password } = accounts[idx];

            logger.add(`尝试登录 [${idx + 1}/${accounts.length}]: ${email}`);

            // 尝试多种选择器

            const emailInput = document.querySelector('input[name="email"], input[type="email"], #email');

            const passwordInput = document.querySelector('input[name="password"], input[type="password"], #password');

            const submitBtn = document.querySelector('button[type="submit"], input[type="submit"], .login-button');

            console.log('登录表单元素:', { emailInput, passwordInput, submitBtn });

            if (emailInput && passwordInput && submitBtn) {

                emailInput.value = email;

                passwordInput.value = password;

                

                // 触发输入事件

                ['input', 'change'].forEach(eventType => {

                    emailInput.dispatchEvent(new Event(eventType, { bubbles: true }));

                    passwordInput.dispatchEvent(new Event(eventType, { bubbles: true }));

                });

                

                submitBtn.click();

                logger.add(`✅ 已提交登录: ${email}`);

            } else {

                logger.add('❌ 登录表单未找到！');

                console.log('可用表单元素:', {

                    inputs: document.querySelectorAll('input'),

                    buttons: document.querySelectorAll('button')

                });

            }

        }, 1500);

    };

    const handleUserPage = async () => {

        console.log('👤 处理用户页面...');

        

        setTimeout(async () => {

            if (!isAutoEnabled()) {

                logger.add('自动签到已禁用');

                return;

            }

            const accounts = getAccounts();

            const currentIndex = getCurrentIndex();

            if (accounts.length === 0) {

                logger.add('⚠️ 没有配置账户');

                return;

            }

            

            if (currentIndex >= accounts.length) {

                logger.add('所有账户已完成，重置索引');

                GM_setValue('ikuuuCurrentIndex', '0');

                return;

            }

            const currentAccount = accounts[currentIndex];

            const email = currentAccount.email;

            // 检查本地记录是否已签到

            const localCheckedIn = hasCheckedInToday(email);

            if (localCheckedIn) {

                logger.add(`⏭️ 本地记录: ${email} 今日已签到`);

                processNextAccount();

                return;

            }

            logger.add(`正在为 ${email} 执行签到（通过 API）...`);

            try {

                const result = await performCheckinViaAPI(email);

                if (result.success) {

                    logger.add(`✅ ${result.message}`);

                    processNextAccount();

                } else if (result.skipped) {

                    logger.add(`ℹ️ ${result.message}`);

                    processNextAccount();

                } else {

                    logger.add(`⚠️ ${result.message}`);

                    processNextAccount();

                }

            } catch (err) {

                logger.add(`❌ 签到失败: ${err.message}`);

                processNextAccount();

            }

        }, 2000);

    };

    // ========================

    // 🖥️ 账户管理面板

    // ========================

    let accountPanelVisible = false;

    let accountPanelElement = null;

    const toggleAccountPanel = () => {

        if (accountPanelVisible && accountPanelElement) {

            accountPanelElement.remove();

            accountPanelVisible = false;

            accountPanelElement = null;

        } else {

            showAccountPanel();

            accountPanelVisible = true;

        }

    };

    const showAccountPanel = () => {

        // 移除已存在的面板

        if (accountPanelElement) {

            accountPanelElement.remove();

        }

        const panel = document.createElement('div');

        panel.className = 'ik-account-panel';

        const accounts = getAccounts();

        const currentIndex = getCurrentIndex();

        const validIndex = Math.min(Math.max(0, currentIndex), Math.max(0, accounts.length - 1));

        panel.innerHTML = `

            <div style="padding: 15px 20px; background: linear-gradient(135deg, #4a6fa5, #2c3e50); color: white;">

                <h4 style="margin: 0; font-weight: 600; font-size: 16px;">账户管理</h4>

                <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">

                    当前账户: <span id="current-account" style="font-weight: 600;">${validIndex + 1}/${accounts.length || 1}</span>

                </div>

            </div>

            <div style="padding: 15px; max-height: 400px; overflow-y: auto;">

                <div id="account-list" style="margin-bottom: 15px;"></div>

                

                <div style="border-top: 1px solid #eee; padding-top: 15px;">

                    <h5 style="margin: 0 0 10px 0; font-weight: 600; font-size: 14px; color: #2c3e50;">添加账户</h5>

                    <input type="email" id="new-email" placeholder="邮箱" 

                           style="width: 100%; padding: 8px 12px; margin-bottom: 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; box-sizing: border-box;">

                    <input type="password" id="new-password" placeholder="密码" 

                           style="width: 100%; padding: 8px 12px; margin-bottom: 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; box-sizing: border-box;">

                    <input type="text" id="new-note" placeholder="备注（可选）" 

                           style="width: 100%; padding: 8px 12px; margin-bottom: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; box-sizing: border-box;">

                    <button id="add-account-btn" class="ik-btn" 

                           style="width: 100%; background: #4a6fa5; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px;">

                        添加账户

                    </button>

                </div>

                

                <div style="border-top: 1px solid #eee; padding-top: 15px; margin-top: 15px;">

                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">

                        <span style="font-weight: 600; font-size: 13px; color: #2c3e50;">自动登录/签到</span>

                        <label class="auto-toggle">

                            <input type="checkbox" id="auto-login-toggle" ${isAutoEnabled() ? 'checked' : ''}>

                            <span class="slider"></span>

                        </label>

                    </div>

                    

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">

                        <button id="manual-sign-btn" class="ik-btn" 

                                style="background: #27ae60; color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 12px;">

                            手动签到

                        </button>

                        <button id="reset-first-btn" class="ik-btn" 

                                style="background: #e74c3c; color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 12px;">

                            重置索引

                        </button>

                    </div>

                    

                    <button id="clear-checkin-btn" class="ik-btn" 

                            style="width: 100%; background: #f39c12; color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 12px; margin-top: 8px;">

                        清除签到记录

                    </button>

                    

                    <button id="export-btn" class="ik-btn" 

                            style="width: 100%; background: #9b59b6; color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 12px; margin-top: 8px;">

                        导出账户

                    </button>

                    

                    <button id="import-btn" class="ik-btn" 

                            style="width: 100%; background: #3498db; color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 12px; margin-top: 8px;">

                        导入账户

                    </button>

                </div>

            </div>

        `;

        document.body.appendChild(panel);

        accountPanelElement = panel;

        initAccountPanel();

    };

    const initAccountPanel = () => {

        const accounts = getAccounts();

        const currentIndex = getCurrentIndex();

        

        // 确保索引在有效范围内

        const validIndex = Math.min(Math.max(0, currentIndex), Math.max(0, accounts.length - 1));

        if (validIndex !== currentIndex) {

            GM_setValue('ikuuuCurrentIndex', validIndex.toString());

        }

        

        // 更新当前账户显示

        const currentAccountEl = document.getElementById('current-account');

        if (currentAccountEl) {

            currentAccountEl.textContent = `${validIndex + 1}/${accounts.length || 1}`;

        }

        // 渲染账户列表

        const list = document.getElementById('account-list');

        if (!list) return;

        

        if (accounts.length === 0) {

            list.innerHTML = `

                <div style="text-align: center; padding: 20px; color: #7f8c8d;">

                    <div style="font-size: 14px;">暂无账户</div>

                    <div style="font-size: 12px; margin-top: 4px;">请添加账户开始使用</div>

                </div>

            `;

        } else {

            list.innerHTML = accounts.map((acc, idx) => {

                const isCurrent = idx === validIndex;

                const hasChecked = hasCheckedInToday(acc.email);

                

                return `

                    <div style="padding: 10px; border-radius: 8px; margin-bottom: 8px; 

                                background: ${isCurrent ? '#e8f4fd' : '#f8f9fa'}; 

                                border-left: 3px solid ${isCurrent ? '#1976d2' : '#4a6fa5'}; 

                                position: relative; cursor: pointer;"

                         data-index="${idx}">

                        <div style="display: flex; justify-content: space-between; align-items: start;">

                            <div style="flex: 1;">

                                <div style="font-weight: 600; color: #2c3e50; font-size: 13px; margin-bottom: 2px;">

                                    ${acc.email}

                                    ${isCurrent ? '<span style="color: #e74c3c; font-size: 10px; margin-left: 4px;">[当前]</span>' : ''}

                                </div>

                                <div style="font-size: 11px; color: #7f8c8d; margin-bottom: 4px;">

                                    ${acc.note || '无备注'}

                                </div>

                                <div style="display: flex; align-items: center; gap: 8px;">

                                    <span style="font-size: 10px; padding: 2px 6px; 

                                          background: ${hasChecked ? '#27ae60' : '#e74c3c'}; 

                                          color: white; border-radius: 10px;">

                                        ${hasChecked ? '已签' : '未签'}

                                    </span>

                                </div>

                            </div>

                            <div class="account-actions" style="display: none; margin-left: 8px;">

                                <button class="ik-edit-btn" data-index="${idx}"

                                        style="background: #3498db; color: white; border: none; 

                                               width: 24px; height: 24px; border-radius: 50%; 

                                               cursor: pointer; font-size: 11px; margin-right: 4px;">

                                    ✏️

                                </button>

                                <button class="ik-delete-btn" data-index="${idx}"

                                        style="background: #e74c3c; color: white; border: none; 

                                               width: 24px; height: 24px; border-radius: 50%; 

                                               cursor: pointer; font-size: 11px;">

                                    ×

                                </button>

                            </div>

                        </div>

                    </div>

                `;

            }).join('');

        }

        // 绑定账户列表事件

        const accountItems = list.querySelectorAll('div[data-index]');

        accountItems.forEach(item => {

            const index = parseInt(item.dataset.index);

            

            // 悬停效果

            item.addEventListener('mouseenter', () => {

                item.style.transform = 'translateY(-2px)';

                item.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';

                const actions = item.querySelector('.account-actions');

                if (actions) actions.style.display = 'flex';

            });

            

            item.addEventListener('mouseleave', () => {

                item.style.transform = 'none';

                item.style.boxShadow = 'none';

                const actions = item.querySelector('.account-actions');

                if (actions) actions.style.display = 'none';

            });

            

            // 点击切换账户

            item.addEventListener('click', (e) => {

                if (e.target.closest('.ik-edit-btn') || e.target.closest('.ik-delete-btn')) {

                    return;

                }

                

                if (index !== validIndex) {

                    GM_setValue('ikuuuCurrentIndex', index.toString());

                    logger.add(`切换到账户 ${index + 1}`);

                    initAccountPanel();

                    updateAccountButton();

                }

            });

            

            // 绑定编辑按钮

            const editBtn = item.querySelector('.ik-edit-btn');

            if (editBtn) {

                editBtn.addEventListener('click', (e) => {

                    e.stopPropagation();

                    editAccount(index);

                });

            }

            

            // 绑定删除按钮

            const deleteBtn = item.querySelector('.ik-delete-btn');

            if (deleteBtn) {

                deleteBtn.addEventListener('click', (e) => {

                    e.stopPropagation();

                    deleteAccount(index);

                });

            }

        });

        // 绑定其他按钮事件

        bindPanelEvents();

    };

    const bindPanelEvents = () => {

        // 添加账户按钮

        const addBtn = document.getElementById('add-account-btn');

        if (addBtn) {

            addBtn.onclick = () => {

                const email = document.getElementById('new-email').value.trim();

                const password = document.getElementById('new-password').value.trim();

                const note = document.getElementById('new-note').value.trim();

                

                if (!email || !password) {

                    alert('邮箱和密码不能为空！');

                    return;

                }

                

                if (!email.includes('@') || !email.includes('.')) {

                    alert('邮箱格式不正确！');

                    return;

                }

                

                const accounts = getAccounts();

                

                // 检查重复账户

                if (accounts.some(acc => acc.email === email)) {

                    alert('该邮箱已存在！');

                    return;

                }

                

                accounts.push({ email, password, note });

                saveAccounts(accounts);

                

                // 清空输入框

                document.getElementById('new-email').value = '';

                document.getElementById('new-password').value = '';

                document.getElementById('new-note').value = '';

                

                logger.add(`✅ 账户添加成功: ${email}`);

                initAccountPanel();

                updateAccountButton();

            };

        }

        // 自动登录开关

        const toggle = document.getElementById('auto-login-toggle');

        if (toggle) {

            toggle.onchange = (e) => {

                setAutoEnabled(e.target.checked);

                logger.add(`自动登录 ${e.target.checked ? '启用' : '禁用'}`);

            };

        }

        // 重置按钮

        const resetBtn = document.getElementById('reset-first-btn');

        if (resetBtn) {

            resetBtn.onclick = () => {

                GM_setValue('ikuuuCurrentIndex', '0');

                logger.add('已重置为第一个账户');

                initAccountPanel();

                updateAccountButton();

            };

        }

        // 手动签到按钮

        const manualBtn = document.getElementById('manual-sign-btn');

        if (manualBtn) {

            manualBtn.onclick = handleManualSign;

        }

        // 清除签到记录按钮

        const clearBtn = document.getElementById('clear-checkin-btn');

        if (clearBtn) {

            clearBtn.onclick = clearCheckinRecords;

        }

        // 导出按钮

        const exportBtn = document.getElementById('export-btn');

        if (exportBtn) {

            exportBtn.onclick = exportAccounts;

        }

        // 导入按钮

        const importBtn = document.getElementById('import-btn');

        if (importBtn) {

            importBtn.onclick = importAccounts;

        }

    };

    const editAccount = (index) => {

        const accounts = getAccounts();

        if (index >= accounts.length) return;

        

        const account = accounts[index];

        

        const modal = document.createElement('div');

        modal.style.cssText = `

            position: fixed;

            top: 0; left: 0; width: 100%; height: 100%;

            background: rgba(0,0,0,0.5); z-index: 20000;

            display: flex; justify-content: center; align-items: center;

        `;

        

        modal.innerHTML = `

            <div style="background: white; padding: 20px; border-radius: 12px; width: 300px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">

                <h4 style="margin: 0 0 15px 0; color: #2c3e50;">编辑账户</h4>

                <input type="email" id="edit-email" value="${account.email}" placeholder="邮箱" 

                       style="width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 6px;">

                <input type="password" id="edit-password" value="${account.password}" placeholder="密码" 

                       style="width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 6px;">

                <input type="text" id="edit-note" value="${account.note || ''}" placeholder="备注（可选）" 

                       style="width: 100%; padding: 8px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 6px;">

                <div style="display: flex; gap: 8px;">

                    <button id="save-edit" 

                            style="flex:1; background: #27ae60; color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer;">

                        保存

                    </button>

                    <button id="cancel-edit" 

                            style="flex:1; background: #95a5a6; color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer;">

                        取消

                    </button>

                </div>

            </div>

        `;

        

        document.body.appendChild(modal);

        

        const closeEdit = () => modal.remove();

        

        // 取消按钮

        modal.querySelector('#cancel-edit').addEventListener('click', closeEdit);

        

        // 保存按钮

        modal.querySelector('#save-edit').addEventListener('click', () => {

            const email = modal.querySelector('#edit-email').value.trim();

            const password = modal.querySelector('#edit-password').value.trim();

            const note = modal.querySelector('#edit-note').value.trim();

            

            if (!email || !password) {

                alert('邮箱和密码不能为空！');

                return;

            }

            

            accounts[index] = { email, password, note };

            saveAccounts(accounts);

            

            logger.add(`✅ 账户 ${index + 1} 已更新: ${email}`);

            closeEdit();

            initAccountPanel();

            updateAccountButton();

        });

        

        // 点击外部关闭

        modal.addEventListener('click', (e) => {

            if (e.target === modal) closeEdit();

        });

    };

    const deleteAccount = (index) => {

        const accounts = getAccounts();

        if (index >= accounts.length) return;

        

        const account = accounts[index];

        

        if (!confirm(`确定要删除账户 "${account.email}" 吗？此操作不可恢复！`)) {

            return;

        }

        

        accounts.splice(index, 1);

        saveAccounts(accounts);

        

        // 调整当前索引

        let newIndex = getCurrentIndex();

        if (index < newIndex) {

            newIndex--;

        } else if (index === newIndex) {

            newIndex = Math.max(0, newIndex - 1);

        }

        

        GM_setValue('ikuuuCurrentIndex', Math.max(0, newIndex).toString());

        logger.add(`🗑️ 账户 "${account.email}" 已删除`);

        

        initAccountPanel();

        updateAccountButton();

    };

    const exportAccounts = () => {

        const accounts = getAccounts();

        if (accounts.length === 0) {

            alert('没有账户可导出！');

            return;

        }

        

        const dataStr = JSON.stringify(accounts, null, 2);

        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

        

        const exportFileDefaultName = `ikuuu-accounts-${getToday()}.json`;

        

        const linkElement = document.createElement('a');

        linkElement.setAttribute('href', dataUri);

        linkElement.setAttribute('download', exportFileDefaultName);

        linkElement.click();

        

        logger.add(`✅ 已导出 ${accounts.length} 个账户`);

    };

    const importAccounts = () => {

        const input = document.createElement('input');

        input.type = 'file';

        input.accept = '.json';

        input.style.display = 'none';

        

        input.onchange = (e) => {

            const file = e.target.files[0];

            if (!file) return;

            

            const reader = new FileReader();

            reader.onload = (event) => {

                try {

                    const importedAccounts = JSON.parse(event.target.result);

                    

                    if (!Array.isArray(importedAccounts)) {

                        throw new Error('文件格式不正确');

                    }

                    

                    // 验证每个账户

                    for (const acc of importedAccounts) {

                        if (!acc.email || !acc.password) {

                            throw new Error('账户数据不完整');

                        }

                    }

                    

                    const currentAccounts = getAccounts();

                    const mergedAccounts = [...currentAccounts];

                    

                    // 避免重复

                    for (const newAcc of importedAccounts) {

                        if (!mergedAccounts.some(acc => acc.email === newAcc.email)) {

                            mergedAccounts.push(newAcc);

                        }

                    }

                    

                    saveAccounts(mergedAccounts);

                    logger.add(`✅ 成功导入 ${importedAccounts.length} 个账户，总计 ${mergedAccounts.length} 个账户`);

                    initAccountPanel();

                    updateAccountButton();

                    

                } catch (error) {

                    alert(`导入失败: ${error.message}`);

                    logger.add(`❌ 导入失败: ${error.message}`);

                }

            };

            

            reader.readAsText(file);

        };

        

        document.body.appendChild(input);

        input.click();

        document.body.removeChild(input);

    };

    // ========================

    // 🎯 主初始化函数

    // ========================

    const updateAccountButton = () => {

        const btn = document.querySelector('.ik-account-btn');

        if (btn) {

            const count = getAccounts().length;

            let countSpan = btn.querySelector('.account-count');

            

            if (!countSpan) {

                countSpan = document.createElement('span');

                countSpan.className = 'account-count';

                btn.appendChild(countSpan);

            }

            

            countSpan.textContent = count;

            countSpan.style.display = count > 0 ? 'flex' : 'none';

        }

    };

    const createAccountButton = () => {

        // 移除旧的按钮

        const oldBtn = document.querySelector('.ik-account-btn');

        if (oldBtn) oldBtn.remove();

        const btn = document.createElement('button');

        btn.className = 'ik-account-btn';

        btn.title = 'iKuuu 账户管理';

        btn.innerHTML = '🔧';

        

        // 添加账户数量

        const countSpan = document.createElement('span');

        countSpan.className = 'account-count';

        btn.appendChild(countSpan);

        

        btn.addEventListener('click', toggleAccountPanel);

        document.body.appendChild(btn);

        

        updateAccountButton();

        console.log('✅ 账户管理按钮已创建');

    };

    const initialize = () => {

        console.log('🚀 初始化iKuuu助手...');

        

        // 1. 创建UI元素

        createAccountButton();

        logger.add('脚本启动完成');

        

        // 2. 根据当前页面执行相应功能

        const path = window.location.pathname;

        console.log(`📁 当前页面: ${path}`);

        

        if (path === '/auth/login') {

            logger.add('检测到登录页面');

            handleLoginPage();

        } else if (path === '/user') {

            logger.add('检测到用户页面');

            handleUserPage();

        } else {

            logger.add(`当前页面: ${path}`);

        }

        

        // 3. 初始化账户索引

        const accounts = getAccounts();

        const currentIndex = getCurrentIndex();

        if (accounts.length === 0 && currentIndex !== 0) {

            GM_setValue('ikuuuCurrentIndex', '0');

        } else if (accounts.length > 0 && (currentIndex >= accounts.length || currentIndex < 0)) {

            GM_setValue('ikuuuCurrentIndex', '0');

        }

        

        console.log('🎉 iKuuu助手初始化完成');

    };

    // ========================

    // 🎬 启动脚本

    // ========================

    // 等待页面加载完成

    if (document.readyState === 'loading') {

        document.addEventListener('DOMContentLoaded', function() {

            console.log('📄 DOMContentLoaded 事件触发');

            setTimeout(initialize, 1000);

        });

    } else {

        console.log('📄 DOM 已加载完成');

        setTimeout(initialize, 1000);

    }

})();