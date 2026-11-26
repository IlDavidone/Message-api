const Chatroom = require("../config/database/chatrooms");
const User = require("../config/database/users");
const { getMysqlPool, closeMysqlPool } = require("./mysqlPool");

const toChatroom = (chatroom) => ({
  _id: chatroom._id,
  name: chatroom.name,
  isPublic: chatroom.isPublic,
  creator: chatroom.creator,
  owner: chatroom.owner,
  image: chatroom.image,
  creationDate: chatroom.creationDate,
  updateDate: chatroom.updateDate,
  partecipants: chatroom.partecipants.map((partecipant) => ({
    id: partecipant.id,
    username: partecipant.username,
  })),
  admins: chatroom.admins.map((admin) => ({
    id: admin.id,
    username: admin.username,
  })),
});

const mongoFindByUserId = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    return [];
  }

  const chatrooms = [];

  for (const entry of user.partecipates) {
    const chatroom = await Chatroom.findById(entry.chatroomId);

    if (chatroom) {
      chatrooms.push(toChatroom(chatroom));
    }
  }

  return chatrooms;
};

const mongoRepository = {
  findByUserId: mongoFindByUserId,
  close: async () => {},
};

const mysqlFindByUserId = async (userId) => {
  const [chatroomRows] = await getMysqlPool().execute(
    "SELECT c.id, c.name, c.is_public, c.creator_id, c.owner_id, c.image, c.created_at, c.updated_at FROM participations p JOIN chatrooms c ON c.id = p.chatroom_id WHERE p.user_id = ?",
    [userId]
  );

  if (chatroomRows.length === 0) {
    return [];
  }

  const placeholders = chatroomRows.map(() => "?").join(", ");

  const [memberRows] = await getMysqlPool().execute(
    `SELECT p.chatroom_id, p.user_id, p.is_admin, u.username FROM participations p JOIN users u ON u.id = p.user_id WHERE p.chatroom_id IN (${placeholders})`,
    chatroomRows.map((row) => row.id)
  );

  return chatroomRows.map((row) => {
    const members = memberRows.filter((member) => member.chatroom_id === row.id);

    return {
      _id: row.id,
      name: row.name,
      isPublic: Boolean(row.is_public),
      creator: row.creator_id,
      owner: row.owner_id,
      image: row.image,
      creationDate: row.created_at,
      updateDate: row.updated_at,
      partecipants: members.map((member) => ({
        id: member.user_id,
        username: member.username,
      })),
      admins: members
        .filter((member) => member.is_admin)
        .map((member) => ({ id: member.user_id, username: member.username })),
    };
  });
};

const mysqlRepository = {
  findByUserId: mysqlFindByUserId,
  close: closeMysqlPool,
};

module.exports = process.env.CHATROOM_STORE === "mysql" ? mysqlRepository : mongoRepository;
