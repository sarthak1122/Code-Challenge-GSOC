let inRoom = false;
const createRoomButton = document.querySelector("#create-room-button")
const joinRoomButton = document.querySelector("#join-room-button")
const leaveRoomButton = document.querySelector("#leave-room-button")
const sendMessageButton = document.querySelector("#send-message-button")
const roomStatus = document.querySelector("#room-status");
const socket = io();
let currentRoomName="";
let currentUserName = "";
socket.on("connect",()=>{
    console.log("connected to server.")
    roomStatus.innerText="Room not created"
    roomStatus.style.backgroundColor="green"
    roomStatus.style.color="white"
    roomStatus.style.height="5%"
    roomStatus.style.fontFamily="monospace"
});


socket.on("disconnect",()=>{
    console.log("disconnected from server.")
    roomStatus.style.backgroundColor="red"
    roomStatus.style.color="white"
    roomStatus.innerText=`Disconnected from server. Room was abandoned.`
    currentRoomName = "";
    currentUserName = "";
    inRoom = false;
    sendMessageButton.disabled = true;
    
}
);


socket.on("created-room",()=>{
    roomStatus.innerText=`Room code : ${socket.id}`;
    leaveRoomButton.disabled=false;
    joinRoomButton.disabled=true;
    sendMessageButton.disabled = false;
    currentRoomName=socket.id;
    inRoom = true;
})


socket.on("joined-room",({name,roomName})=>{
    alert(`${name} joined the room!`)
    createRoomButton.disabled=true;
    joinRoomButton.disabled=true;
    leaveRoomButton.disabled = false;
    currentRoomName=roomName
    sendMessageButton.disabled = false;
    roomStatus.innerText=`Joined room : ${currentRoomName}    `
    inRoom = true;
})

socket.on("left-room",({name})=>{
    alert(`${name} left the room`);
})

createRoomButton.addEventListener("click",()=>{
    pulsing = createRoomButton.classList.contains("pulse");
    if (pulsing){
        createRoomButton.classList.remove("pulse")
    }
    const name = prompt("Please enter your name")
    if(name.length<1){
        alert("Invalid name, try again")
    }else{
        sendMessageButton.disabled = false;
        currentUserName = name;
        socket.emit("create-room");
        roomStatus.innerText="Creating room...";
        createRoomButton.disabled=true;
    }
})

joinRoomButton.addEventListener('click',()=>{
    pulsing = createRoomButton.classList.contains("pulse");
    if (pulsing){
        createRoomButton.classList.remove("pulse")
    }
    const code = prompt("Please enter room code: ");
    const name = prompt("Please enter your name: ");
    if (code.length<1 || name.length<1){
        alert("Please enter a valid room code and your name.")
    }
    else{
        socket.emit('join-room',{roomName:code,name:name});
        currentUserName = name;
    } 
})
leaveRoomButton.addEventListener('click',()=>{
    socket.emit("leave-room",{roomName:currentRoomName,name:currentUserName});
    inRoom = false;
    currentRoomName="";
    currentUserName="";
    roomStatus.innerText=`Left room.`;
    createRoomButton.disabled=false;
    joinRoomButton.disabled = false;
    leaveRoomButton.disabled=true;
});

sendMessageButton.addEventListener('click',()=>{
    const input = document.querySelector(".chat-input");
    if(input.value.length<1){
        alert("Cannot send empty message");
    }else{
        // const chatBox = document.querySelector(".chat-log");
        // const messageContainer = document.createElement("p");
        // messageContainer.classList.add("collection-item");
        // messageContainer.classList.add("badge");
        // messageContainer.innerText = `${currentUserName} : ${input.value}`;
        // chatBox.appendChild(messageContainer)
        // chatBox.scrollTop = chatBox.scrollHeight;
        const msg = input.value;
        input.value = "";
        socket.emit("user-sent-message",{roomName:currentRoomName, username: currentUserName,message:msg})
    }
})
socket.on('server-received-message',({roomName,username,message})=>{
    const chatBox = document.querySelector(".chat-log");
    const messageContainer = document.createElement("p");
    messageContainer.classList.add("collection-item");
    messageContainer.classList.add("badge");
    messageContainer.innerText = `${username} : ${message}`;
    chatBox.appendChild(messageContainer)
    chatBox.scrollTop = chatBox.scrollHeight;
})
const cells = {
    Image: {
      xmlns: "http://schemas.microsoft.com/deepzoom/2009",
      Url: "./dzc_output_files/", //folder with tiles stored as images.
      Format: "jpg", //format of the tiles
      Overlap: "1",
      TileSize: "256",
      Size: {
        Width:  "364",
        Height: "274"
      }
    }
  };
  
const viewer = OpenSeadragon(
    {
        id: "seadragon-viewer", //id of the div with openseadragon viewer
        prefixUrl: "//openseadragon.github.io/openseadragon/images/", //url for images used in the viewer
        tileSources: cells,
        debugMode:true,
    }
);

//Handlers
viewer.addHandler("canvas-drag",()=>{
  if(inRoom){
    const center = viewer.viewport.getCenter(); 
    socket.emit("new-pan",{data:center,userName:socket.id,roomName:currentRoomName})
  }
})

socket.on("sync-pan",({data,userName,roomName})=>{
    if((userName!==socket.id)&&(currentRoomName===roomName)){
    viewer.viewport.panTo(data)
    }
})

//Chat functionality