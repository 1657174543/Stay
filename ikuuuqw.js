// ==UserScript==
// @name         iKuuu 测试登录助手 (多账户循环版)
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  【安全测试专用】自动签到+多账户循环（输入"YES"确认）
// @author       Qwen
// @match        https://ikuuu.de/auth/login
// @match        https://ikuuu.de/user
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addValueChangeListener
// ==/UserScript==

(function() {
    'use strict';

    // === 安全确认（强制输入YES）===
    if (prompt('⚠️ 重要安全确认：\n\n此脚本将明文存储密码（仅限测试！）\n\n输入"YES"继续（输入其他内容将退出）') !== "YES") {
        alert("测试已取消。请使用浏览器密码管理器进行安全测试！");
        return;
    }

    // === 添加CSS样式 ===
    const style = document.createElement('style');
    style.textContent = `
        .ik-c6ontrol-panel {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            width: 480px;
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            border: 1px solid #e0e0e0;
        }
        .ik-panel-header {
            padding: 18px 24px;
            background: linear-gradient(135deg, #4a6fa5, #2c3e50);
            color: white;
            border-radius: 12px 12px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .ik-close-btn {
            background: rgba(255,255,255,0.2);
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            color: white;
            font-weight: bold;
            cursor: pointer;
            font-size: 18px;
        }
        .ik-panel-content {
            padding: 24px;
        }
        .ik-account-list {
            margin-bottom: 24px;
        }
        .ik-account-item {
            padding: 14px;
            background: #f8f9fa;
            border-radius: 8px;
            margin-bottom: 12px;
            border-left: 4px solid #4a6fa5;
            cursor: pointer;
            transition: all 0.2s;
        }
        .ik-account-item:hover {
            background: #eef2f7;
            transform: translateX(4px);
        }
        .ik-account-item.active {
            background: #e3f2fd;
            border-left: 4px solid #1976d2;
        }
        .ik-account-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
        }
        .ik-account-email {
            font-weight: 600;
            color: #2c3e50;
        }
        .ik-account-note {
            color: #7f8c8d;
            font-size: 13px;
        }
        .ik-add-form {
            margin-bottom: 24px;
        }
        .ik-input {
            width: 100%;
            padding: 12px 16px;
            margin-bottom: 16px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.2s;
        }
        .ik-input:focus {
            outline: none;
            border-color: #4a6fa5;
            box-shadow: 0 0 0 2px rgba(74, 111, 165, 0.2);
        }
        .ik-btn {
            display: inline-block;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            border: none;
            font-size: 14px;
            transition: all 0.2s;
        }
        .ik-btn-add {
            background: #4a6fa5;
            color: white;
            width: 100%;
        }
        .ik-btn-add:hover {
            background: #3a5a8c;
        }
        .ik-settings {
            border-top: 1px solid #eee;
            padding-top: 24px;
        }
        .ik-setting {
            display: flex;
            align-items: center;
            margin-bottom: 16px;
        }
        .ik-switch {
            position: relative;
            display: inline-block;
            width: 50px;
            height: 24px;
            margin-left: 16px;
        }
        .ik-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        .ik-slider {
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
        .ik-slider:before {
            position: absolute;
            content: "";
            height: 16px;
            width: 16px;
            left: 4px;
            bottom: 4px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
        }
        input:checked + .ik-slider {
            background-color: #4a6fa5;
        }
        input:checked + .ik-slider:before {
            transform: translateX(26px);
        }
        .ik-status {
            display: flex;
            justify-content: space-between;
            color: #7f8c8d;
            margin: 16px 0;
            font-size: 13px;
        }
        .ik-btn-start {
            background: #2ecc71;
            color: white;
            width: 100%;
            margin-bottom: 12px;
        }
        .ik-btn-reset {
            background: #e74c3c;
            color: white;
            width: 100%;
        }
        .ik-status-text {
            color: #27ae60;
            font-weight: 600;
        }
        .ik-status-text.stopped {
            color: #e74c3c;
        }
        .ik-warning {
            background: #fff8e6;
            border-left: 4px solid #ff9800;
            padding: 12px 16px;
            margin-top: 16px;
            border-radius: 0 4px 4px 0;
            color: #e67e22;
            font-size: 13px;
        }
        .ik-warning strong {
            font-weight: 600;
        }
        .ik-reset-btn {
            background: #f39c12;
            color: white;
            width: 100%;
            margin-top: 10px;
            font-weight: bold;
        }
    `;
    document.head.appendChild(style);

    // === 账户索引管理 ===
    const getCurrentIndex = () => parseInt(GM_getValue('ikuuuCurrentIndex', '0'));
    const setCurrentIndex = (index) => GM_setValue('ikuuuCurrentIndex', index.toString());

    // === 渲染账户列表 ===
    const renderAccountList = () => {
        const accounts = JSON.parse(GM_getValue('ikuuuAccounts', '[]'));
        return accounts.map((acc, index) => `
            <div class="ik-account-item ${index === getCurrentIndex() ? 'active' : ''}" data-index="${index}">
                <div class="ik-account-info">
                    <div class="ik-account-email">${acc.email}</div>
                    <div class="ik-account-note">${acc.note || '无备注'}</div>
                </div>
            </div>
        `).join('');
    };

    // === 添加账户 ===
    const addAccount = () => {
        const email = document.getElementById('ik-email').value;
        const password = document.getElementById('ik-password').value;
        const note = document.getElementById('ik-note').value;
        
        if (!email || !password) {
            alert('邮箱和密码不能为空');
            return;
        }
        
        const accounts = JSON.parse(GM_getValue('ikuuuAccounts', '[]'));
        accounts.push({email, password, note});
        GM_setValue('ikuuuAccounts', JSON.stringify(accounts));
        
        // 重置表单
        document.getElementById('ik-email').value = '';
        document.getElementById('ik-password').value = '';
        document.getElementById('ik-note').value = '';
        
        // 重新渲染
        document.getElementById('ik-account-list').innerHTML = renderAccountList();
        document.getElementById('ik-current-account').textContent = `${getCurrentIndex()+1} / ${accounts.length}`;
        
        alert('账户已添加！（明文存储，仅限测试）');
    };

    // === 初始化设置 ===
    const initSettings = () => {
        const autoLogin = GM_getValue('ikuuuAutoLogin', 'false') === 'true';
        const autoLogout = GM_getValue('ikuuuAutoLogout', 'false') === 'true';
        
        // 安全操作：确保元素存在
        const autoLoginCheckbox = document.getElementById('ik-auto-login');
        const autoLogoutCheckbox = document.getElementById('ik-auto-logout');
        
        if (autoLoginCheckbox) autoLoginCheckbox.checked = autoLogin;
        if (autoLogoutCheckbox) autoLogoutCheckbox.checked = autoLogout;
        
        document.getElementById('ik-status-text').textContent = autoLogin ? '运行中' : '已停止';
        document.getElementById('ik-status-text').className = autoLogin ? 'ik-status-text' : 'ik-status-text stopped';
        document.getElementById('ik-start').textContent = autoLogin ? '停止' : '开始';
        
        // 更新当前账户显示
        const accounts = JSON.parse(GM_getValue('ikuuuAccounts', '[]'));
        document.getElementById('ik-current-account').textContent = `${accounts.length ? getCurrentIndex()+1 : 0} / ${accounts.length}`;
    };

    // === 管理面板 ===
    const createManagerPanel = () => {
        // 移除已有的面板（避免重复）
        const existingPanel = document.querySelector('.ik-c6ontrol-panel');
        if (existingPanel) existingPanel.remove();

        // 创建新面板
        const panel = document.createElement('div');
        panel.className = 'ik-c6ontrol-panel';
        panel.innerHTML = `
            <div class="ik-panel-header">
                <h3>iKuuu 账户管理</h3>
                <button class="ik-close-btn">×</button>
            </div>
            <div class="ik-panel-content">
                <div class="ik-account-list" id="ik-account-list">
                    ${renderAccountList()}
                </div>
                <div class="ik-add-form">
                    <h4>添加账户</h4>
                    <input type="email" class="ik-input" id="ik-email" placeholder="邮箱">
                    <input type="password" class="ik-input" id="ik-password" placeholder="密码">
                    <input type="text" class="ik-input" id="ik-note" placeholder="备注（可选）">
                    <button class="ik-btn ik-btn-add">添加</button>
                </div>
                <div class="ik-settings">
                    <h4>设置</h4>
                    <div class="ik-setting">
                        <label>
                            <input type="checkbox" id="ik-auto-login">
                            自动登录
                            <span class="ik-switch">
                                <span class="ik-slider"></span>
                            </span>
                        </label>
                    </div>
                    <div class="ik-setting">
                        <label>
                            <input type="checkbox" id="ik-auto-logout">
                            签到后自动退出
                            <span class="ik-switch">
                                <span class="ik-slider"></span>
                            </span>
                        </label>
                    </div>
                    <div class="ik-status">
                        <div>当前账户: <span id="ik-current-account">0 / 0</span></div>
                        <div>状态: <span id="ik-status-text" class="ik-status-text">已停止</span></div>
                    </div>
                    <button class="ik-btn ik-btn-start" id="ik-start">开始</button>
                    <button class="ik-btn ik-btn-reset" id="ik-reset">重置</button>
                    <button class="ik-btn ik-reset-btn" id="ik-reset-order">重置账户顺序</button>
                    <div class="ik-warning">
                        <strong>⚠️ 重要提示：</strong>此脚本存储明文密码！仅限测试环境使用，切勿用于真实账户！
                    </div>
                </div>
            </div>
        `;

        // 添加关闭按钮事件
        panel.querySelector('.ik-close-btn').addEventListener('click', () => {
            panel.remove();
        });

        // 添加账户按钮
        panel.querySelector('.ik-btn-add').addEventListener('click', addAccount);

        // 开始/停止按钮
        panel.querySelector('#ik-start').addEventListener('click', toggleAutoLogin);

        // 重置按钮
        panel.querySelector('#ik-reset').addEventListener('click', resetSettings);

        // 重置账户顺序按钮
        panel.querySelector('#ik-reset-order').addEventListener('click', resetAccountOrder);

        // 将面板添加到DOM
        document.body.appendChild(panel);

        // 初始化设置
        initSettings();
    };

    // === 切换自动登录 ===
    const toggleAutoLogin = () => {
        const autoLogin = !document.getElementById('ik-auto-login').checked;
        document.getElementById('ik-auto-login').checked = autoLogin;
        GM_setValue('ikuuuAutoLogin', autoLogin.toString());
        
        // 安全更新UI
        document.getElementById('ik-status-text').textContent = autoLogin ? '运行中' : '已停止';
        document.getElementById('ik-status-text').className = autoLogin ? 'ik-status-text' : 'ik-status-text stopped';
        document.getElementById('ik-start').textContent = autoLogin ? '停止' : '开始';
        
        if (autoLogin) {
            autoLoginNow();
        }
    };

    // === 重置所有设置 ===
    const resetSettings = () => {
        GM_setValue('ikuuuAutoLogin', 'false');
        GM_setValue('ikuuuAutoLogout', 'false');
        GM_setValue('ikuuuCurrentIndex', '0'); // 重置当前索引
        document.getElementById('ik-auto-login').checked = false;
        document.getElementById('ik-auto-logout').checked = false;
        document.getElementById('ik-status-text').textContent = '已停止';
        document.getElementById('ik-status-text').className = 'ik-status-text stopped';
        document.getElementById('ik-start').textContent = '开始';
        alert('设置已重置！账户顺序已恢复到第一个');
    };

    // === 重置账户顺序（从第一个开始）===
    const resetAccountOrder = () => {
        GM_setValue('ikuuuCurrentIndex', '0'); // 直接重置为0
        const accounts = JSON.parse(GM_getValue('ikuuuAccounts', '[]'));
        document.getElementById('ik-current-account').textContent = `1 / ${accounts.length}`;
        alert('账户顺序已重置！下次开始将从第一个账户执行');
    };

    // === 自动登录流程 ===
    const autoLoginNow = () => {
        const accounts = JSON.parse(GM_getValue('ikuuuAccounts', '[]'));
        const currentIndex = getCurrentIndex();
        
        // 所有账户处理完毕
        if (currentIndex >= accounts.length) {
            console.log('✅ 所有账户签到完成，自动停止脚本');
            GM_setValue('ikuuuAutoLogin', 'false');
            document.getElementById('ik-status-text').textContent = '已停止';
            document.getElementById('ik-status-text').className = 'ik-status-text stopped';
            document.getElementById('ik-start').textContent = '开始';
            return;
        }

        const {email, password} = accounts[currentIndex];
        document.getElementById('email').value = email;
        document.getElementById('password').value = password;
        
        // 1秒后提交登录
        setTimeout(() => {
            document.querySelector('button[type="submit"]').click();
            console.log(`✅ 自动登录触发（账户: ${email}）`);
        }, 1000);
    };

    // === 自动签到与退出 ===
    const checkAndSign = (currentIndex, accounts) => {
        // 检查签到按钮
        const checkinButton = document.querySelector('a[href="#"][onclick="checkin()"]');
        
        if (checkinButton) {
            console.log('✅ 检测到未签到按钮，点击签到');
            checkinButton.click();
            
            // 1秒后检查签到状态
            setTimeout(() => {
                checkSignStatus(currentIndex, accounts);
            }, 1000);
        } else {
            console.log('✅ 签到按钮不存在（已签到或已退出），跳过签到');
            handleLogout(currentIndex, accounts);
        }
    };

    const checkSignStatus = (currentIndex, accounts) => {
        // 检查签到成功状态
        const successButton = document.querySelector('a.btn.btn-icon.disabled');
        
        if (successButton) {
            console.log('✅ 签到成功！执行自动退出');
            handleLogout(currentIndex, accounts);
        } else {
            console.log('⚠️ 签到未完成，等待重试（2秒后）');
            setTimeout(() => checkSignStatus(currentIndex, accounts), 2000);
        }
    };

    const handleLogout = (currentIndex, accounts) => {
        // 自动退出（如果启用）
        if (GM_getValue('ikuuuAutoLogout', 'false') === 'true') {
            // 关键修复：先更新当前索引，再退出
            setCurrentIndex(currentIndex + 1);
            window.location.href = '/user/logout'; // 修正为正确的退出URL
            console.log('✅ 自动退出触发（跳转至退出页面）');
            return;
        }
        
        // 未启用自动退出：直接切换账户
        setCurrentIndex(currentIndex + 1);
        console.log(`✅ 账户签到完成，切换至下一个账户（当前索引: ${currentIndex+1}）`);
        
        // 自动登录下一个账户
        if (currentIndex + 1 < accounts.length) {
            setTimeout(() => {
                autoLoginNow();
            }, 1500);
        }
    };

    // === 关键修复：在签到页面自动执行签到 ===
    const autoCheckInOnUserPage = () => {
        console.log('✅ 在签到页面执行自动签到');
        checkAndSign(getCurrentIndex(), JSON.parse(GM_getValue('ikuuuAccounts', '[]')));
    };

    // === 初始化 ===
    if (window.location.href.includes('/auth/login')) {
        // 创建管理面板（只在登录页面显示）
        createManagerPanel();
        
        // 添加页面提示
        const pageNotice = document.createElement('div');
        pageNotice.style.position = 'fixed';
        pageNotice.style.bottom = '20px';
        pageNotice.style.left = '50%';
        pageNotice.style.transform = 'translateX(-50%)';
        pageNotice.style.backgroundColor = '#fff8e6';
        pageNotice.style.color = '#ff9800';
        pageNotice.style.padding = '10px 20px';
        pageNotice.style.borderRadius = '4px';
        pageNotice.style.fontWeight = 'bold';
        pageNotice.style.zIndex = '9998';
        pageNotice.innerHTML = '⚠️ 测试环境：明文存储（仅限测试！）';
        document.body.appendChild(pageNotice);
        
        // 自动登录（如果启用）
        if (GM_getValue('ikuuuAutoLogin', 'false') === 'true') {
            autoLoginNow();
        }
    } else if (window.location.href.includes('/user')) {
        // 在签到页面自动执行签到
        autoCheckInOnUserPage();
    }
})();
