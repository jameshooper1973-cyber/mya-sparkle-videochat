const socket = io();

let localStream;
let peerConnection;
let roomName;

document.getElementById("joinBtn").onclick = joinRoom;

async function joinRoom() {
    roomName = document.getElementById("room").value;

    if (!roomName) {
        alert("Enter a room name");
        return;
    }

    await setupMedia();

    socket.emit("join", roomName);
}

async function setupMedia() {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    document.getElementById("localVideo").srcObject = localStream;
}

socket.on("ready", () => {
    createPeer(true);
});

socket.on("signal", (data) => {
    if (!peerConnection) createPeer(false);

    if (data.sdp) {
        peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
        if (data.sdp.type === "offer") {
            peerConnection.createAnswer().then(answer => {
                peerConnection.setLocalDescription(answer);
                socket.emit("signal", { room: roomName, sdp: answer });
            });
        }
    }

    if (data.ice) {
        peerConnection.addIceCandidate(new RTCIceCandidate(data.ice));
    }
});

function createPeer(isCaller) {
    peerConnection = new RTCPeerConnection();

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = (event) => {
        document.getElementById("remoteVideo").srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit("signal", { room: roomName, ice: event.candidate });
        }
    };

    if (isCaller) {
        peerConnection.createOffer().then(offer => {
            peerConnection.setLocalDescription(offer);
            socket.emit("signal", { room: roomName, sdp: offer });
        });
    }
}

