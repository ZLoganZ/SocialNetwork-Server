const { User } = require('../models/User');
const STATUS_CODE = require('../util/SettingSystem');
const _ = require('lodash');
const { default: axios } = require('axios');

const registerUser_Service = async (user) => {
  const { firstname, lastname, email, password } = user;

  // Check for existing user
  const userFind = await User.CheckEmail(email);
  if (userFind) {
    return {
      status: STATUS_CODE.CONFLICT,
      success: false,
      message: 'Email already exists!',
    };
  }
  // All good
  const newUser = new User({
    firstname,
    lastname,
    email,
    password,
    username: lastname + ' ' + firstname,
  });
  await newUser.save();

  return {
    status: STATUS_CODE.CREATED,
    success: true,
    message: 'User created successfully',
    content: {
      accessToken: newUser.accessToken,
      _id: newUser._id,
    },
  };
};

const findUserByID_Service = async (userID) => {
  const userFind = await User.GetUser(userID);

  if (!userFind) {
    return {
      status: STATUS_CODE.NOT_FOUND,
      success: false,
      message: 'User does not exist!',
    };
  } else {
    return {
      status: STATUS_CODE.SUCCESS,
      success: true,
      message: 'User found successfully',
      content: {
        userInfo: {
          id: userFind._id,
          firstname: userFind.firstname,
          lastname: userFind.lastname,
          tags: userFind.tags,
          email: userFind.email,
          contacts: userFind.contacts,
          username: userFind.username,
          userImage: userFind.userImage,
          followers: userFind.followers,
          following: userFind.following,
          posts: userFind.posts,
          dayJoined: new Date(userFind.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          location: userFind.location,
          coverImage: userFind.coverImage,
          alias: userFind.alias,
          about: userFind.about,
          experiences: userFind.experiences,
          repositories: userFind.repositories,
        },
      },
    };
  }
};

const updateUser_Service = async (userID, userUpdate) => {
  const userFind = await User.UpdateUser(userID, userUpdate);

  if (!userFind) {
    return {
      status: STATUS_CODE.NOT_FOUND,
      success: false,
      message: 'User does not exist!',
    };
  }

  const user = await User.GetUser(userID);

  return {
    status: STATUS_CODE.SUCCESS,
    success: true,
    message: 'User updated successfully',
    content: {
      ownerInfo: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        tags: user.tags,
        contacts: user.contacts,
        username: user.username,
        userImage: user.userImage,
        followers: user.followers,
        following: user.following,
        posts: user.posts,
        dayJoined: new Date(user.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        location: user.location,
        coverImage: user.coverImage,
        alias: user.alias,
        about: user.about,
        experiences: user.experiences,
        repositories: user.repositories,
      },
      userInfo: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        tags: user.tags,
        contacts: user.contacts,
        username: user.username,
        userImage: user.userImage,
        followers: user.followers,
        following: user.following,
        posts: user.posts,
        dayJoined: new Date(user.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        location: user.location,
        coverImage: user.coverImage,
        alias: user.alias,
        about: user.about,
        experiences: user.experiences,
        repositories: user.repositories,
      },
    },
  };
};

const expertise_Service = async (userID, expertise) => {
  const user = await User.GetUser(userID);

  if (!user) {
    return {
      status: STATUS_CODE.NOT_FOUND,
      success: false,
      message: 'User does not exist!',
    };
  }

  await user.HandleTags(expertise);

  return {
    status: STATUS_CODE.SUCCESS,
    success: true,
    message: 'User updated successfully',
    content: {
      ownerInfo: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        tags: user.tags,
        contacts: user.contacts,
        username: user.username,
        userImage: user.userImage,
        followers: user.followers,
        following: user.following,
        posts: user.posts,
        dayJoined: new Date(user.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        location: user.location,
        coverImage: user.coverImage,
        alias: user.alias,
        about: user.about,
        experiences: user.experiences,
        repositories: user.repositories,
      },
    },
  };
};

const getFollowed_Service = async (userID) => {
  const user = await User.GetFollowers(userID);

  const followers = [...user.followers];

  const following = [...user.following];

  if (!followers || !following) {
    return {
      status: STATUS_CODE.NOT_FOUND,
      success: false,
      message: 'User does not follow anyone or have any followers!',
    };
  }

  // Remove unnecessary information
  followers.forEach((follower) => {
    follower.password = undefined;
    follower.accessToken = undefined;
    follower.followers = undefined;
    follower.following = undefined;
    follower.shares = undefined;
    follower.favorites = undefined;
    follower.tags = undefined;
    follower.__v = undefined;
  });

  following.forEach((follow) => {
    follow.password = undefined;
    follow.accessToken = undefined;
    follow.followers = undefined;
    follow.following = undefined;
    follow.shares = undefined;
    follow.favorites = undefined;
    follow.tags = undefined;
    follow.__v = undefined;
  });

  // Combine followers and following into one array and remove duplicate users
  const followersAndFollowing = _.unionBy(followers, following, 'email');

  const userInfo = {
    id: user._id,
    firstname: user.firstname,
    lastname: user.lastname,
    tags: user.tags,
    contacts: user.contacts,
    username: user.username,
    userImage: user.userImage,
    followers: user.followers,
    following: user.following,
    posts: user.posts,
    dayJoined: new Date(user.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    location: user.location,
    coverImage: user.coverImage,
    alias: user.alias,
    about: user.about,
    experiences: user.experiences,
    repositories: user.repositories,
  };

  return {
    status: STATUS_CODE.SUCCESS,
    success: true,
    message: 'Get all followers successfully',
    content: {
      userInfo,
      followers: followersAndFollowing,
    },
  };
};

const followUser_Service = async (userID, userFollowID) => {
  const user = await User.GetUser(userID);
  const userFollow = await User.GetUser(userFollowID);

  if (!user || !userFollow) {
    return {
      status: STATUS_CODE.NOT_FOUND,
      success: false,
      message: 'User does not exist!',
    };
  }

  // Check if user already follow userFollow
  const isFollow = user.following.indexOf(userFollowID) !== -1;
  if (isFollow) {
    // Remove userFollow from user's following
    await user.RemoveFollowing(userFollowID);

    // Remove user from userFollow's followers
    await userFollow.RemoveFollower(userID);

    return {
      status: STATUS_CODE.SUCCESS,
      success: true,
      message: 'Unfollow user successfully',
    };
  }

  await user.SaveFollowing(userFollowID);
  await userFollow.SaveFollower(userID);

  return {
    status: STATUS_CODE.SUCCESS,
    success: true,
    message: 'Follow user successfully',
  };
};

const getShouldFollow_Service = async (userID) => {
  const user = await User.GetUser(userID);

  if (!user) {
    return {
      status: STATUS_CODE.NOT_FOUND,
      success: false,
      message: 'User does not exist!',
    };
  }

  const users = await User.GetAllUsers();

  // Remove user from users
  const shouldFollow = users.filter((user) => user._id.toString() !== userID);

  // Remove users that user already follow
  shouldFollow.forEach((user) => {
    user.followers.forEach((follower) => {
      if (follower.toString() === userID) {
        shouldFollow.splice(shouldFollow.indexOf(user), 1);
      }
    });
  });

  // Remove users that follow user
  shouldFollow.forEach((user) => {
    user.following.forEach((follow) => {
      if (follow.toString() === userID) {
        shouldFollow.splice(shouldFollow.indexOf(user), 1);
      }
    });
  });

  // Select users with 1 of the same expertise as the user, remove duplicate users, sort by number of followers and get top 25
  const userExpertise = user.tags;
  const shouldFollowExpertise = shouldFollow.filter((user) =>
    user.tags.filter((expertise) => userExpertise.includes(expertise)),
  );
  const shouldFollowExpertiseUnique = _.unionBy(shouldFollowExpertise, 'email');
  const shouldFollowExpertiseSorted = shouldFollowExpertiseUnique.sort(
    (a, b) => b.followers.length - a.followers.length,
  );
  shouldFollowExpertiseSorted.splice(25);

  // Remove unnecessary information
  shouldFollowExpertiseSorted.forEach((user) => {
    user.password = undefined;
    user.accessToken = undefined;
    user.followers = undefined;
    user.following = undefined;
    user.shares = undefined;
    user.favorites = undefined;
    user.__v = undefined;
    user.posts = undefined;
    user.userRole = undefined;
    user.contacts = undefined;
    user.location = undefined;
  });

  const userInfo = {
    id: user._id,
    firstname: user.firstname,
    lastname: user.lastname,
    tags: user.tags,
    contacts: user.contacts,
    username: user.username,
    userImage: user.userImage,
    followers: user.followers,
    following: user.following,
    posts: user.posts,
    dayJoined: new Date(user.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    location: user.location,
    coverImage: user.coverImage,
    alias: user.alias,
    about: user.about,
    experiences: user.experiences,
    repositories: user.repositories,
  };

  if (shouldFollowExpertiseSorted.length === 0) {
    return {
      status: STATUS_CODE.SUCCESS,
      success: true,
      message: 'Get all users successfully',
      content: {
        userInfo,
        users: users,
      },
    };
  }

  return {
    status: STATUS_CODE.SUCCESS,
    success: true,
    message: 'Get all users successfully',
    content: {
      userInfo,
      users: shouldFollowExpertiseSorted,
    },
  };
};

const getRepositoryGithub_Service = async (access_token_github) => {
  const { data: result } = await axios.get('https://api.github.com/user/repos', {
    headers: {
      Authorization: `Bearer ${access_token_github}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!result) {
    return {
      status: STATUS_CODE.NOT_FOUND,
      success: false,
      message: 'User does not exist!',
    };
  }

  // Remove unnecessary information
  const repos = await Promise.all(
    result.map(async (repository) => {
      const { data } = await axios.get(repository.languages_url, {
        headers: {
          Authorization: `Bearer ${access_token_github}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      return {
        id: repository.id,
        name: repository.name,
        private: repository.private,
        url: repository.html_url,
        watchersCount: repository.watchers_count,
        forksCount: repository.forks_count,
        stargazersCount: repository.stargazers_count,
        languages: Object.keys(data)[0],
      };
    }),
  );
  return {
    status: STATUS_CODE.SUCCESS,
    success: true,
    message: 'Get repository successfully',
    content: {
      repository: repos,
    },
  };
};

module.exports = {
  registerUser_Service,
  findUserByID_Service,
  updateUser_Service,
  expertise_Service,
  getFollowed_Service,
  followUser_Service,
  getShouldFollow_Service,
  getRepositoryGithub_Service,
};
