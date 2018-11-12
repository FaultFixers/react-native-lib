window.sessionId = new window.ObjectID().toString();

let deviceId = window.localStorage.getItem('deviceId');
if (!deviceId) {
    deviceId = new window.ObjectID().toString();
    window.localStorage.setItem('deviceId', deviceId);
}
window.deviceId = deviceId;
