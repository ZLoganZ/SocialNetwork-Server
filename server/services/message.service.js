const STATUS_CODE = require('../util/SettingSystem');
const { Message } = require('../models/Message');
const { Conversation } = require('../models/Conversation');
const { pusherServer } = require('../config/pusher');

const createMessage_Service = async (message) => {
  const { body, image, conversationID, sender } = message;

  const newMessage = await Message.CreateMessage({
    body,
    image,
    conversation: conversationID,
    sender,
    seen: [sender],
  });

  const updatedConversation = await Conversation.UpdateConversation(conversationID, {
    $push: { messages: newMessage._id },
    lastMessageAt: newMessage.createAt,
  });

  await pusherServer.trigger(conversationID, 'new-message', newMessage);

  const lastMessage = updatedConversation.messages[updatedConversation.messages.length - 1];

  updatedConversation.users.forEach((user) => {
    if (user._id) {
      let channel_name = user._id;
      channel_name = channel_name.toString();
      pusherServer.trigger(channel_name, 'conversation-update', {
        id: conversationID,
        messages: [lastMessage],
      });
    }
  });
};

const getAllMessage_Service = async (conversationID) => {
  const messages = await Message.GetMessages(conversationID);

  return {
    status: STATUS_CODE.SUCCESS,
    success: true,
    message: 'Get all messages successfully',
    content: {
      messages,
    },
  };
};

module.exports = {
  createMessage_Service,
  getAllMessage_Service,
};
