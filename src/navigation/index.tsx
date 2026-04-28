import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuth } from '../hooks/useAuth';
import { LoadingScreen } from '../components/LoadingScreen';

// Auth
import LoginScreen             from '../screens/auth/LoginScreen';
import RegisterScreen          from '../screens/auth/RegisterScreen';
import VerifyScreen            from '../screens/auth/VerifyScreen';
import VerifyAcceptanceScreen  from '../screens/auth/VerifyAcceptanceScreen';

// Community
import CommunityHomeScreen from '../screens/community/CommunityHomeScreen';
import PostListScreen      from '../screens/community/PostListScreen';
import PostDetailScreen    from '../screens/community/PostDetailScreen';
import PostCreateScreen    from '../screens/community/PostCreateScreen';

// Marketplace
import MarketplaceScreen       from '../screens/marketplace/MarketplaceScreen';
import MarketplaceDetailScreen from '../screens/marketplace/MarketplaceDetailScreen';
import MarketplaceCreateScreen from '../screens/marketplace/MarketplaceCreateScreen';

// Chat
import ChatListScreen from '../screens/chat/ChatListScreen';
import ChatRoomScreen from '../screens/chat/ChatRoomScreen';

// MyPage
import MyPageScreen     from '../screens/mypage/MyPageScreen';
import MyPostsScreen    from '../screens/mypage/MyPostsScreen';
import MyCommentsScreen from '../screens/mypage/MyCommentsScreen';

// Notices
import NoticesScreen      from '../screens/notices/NoticesScreen';
import NoticeDetailScreen from '../screens/notices/NoticeDetailScreen';

// Others
import LaundryScreen  from '../screens/laundry/LaundryScreen';
import RoomWishScreen from '../screens/roomWish/RoomWishScreen';

// ── 파라미터 타입 ─────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Login:            undefined;
  Register:         undefined;
  Verify:           undefined;
  VerifyAcceptance: undefined;
  Main:             undefined;
};

export type CommunityStackParamList = {
  CommunityHome: undefined;
  PostList:      { board: string; title: string };
  PostDetail:    { postId: string };
  PostCreate:    { board: string };
};

export type MarketplaceStackParamList = {
  MarketplaceHome:   undefined;
  MarketplaceDetail: { postId: string };
  MarketplaceCreate: undefined;
};

export type ChatStackParamList = {
  ChatList: undefined;
  ChatRoom: { chatId: string; otherUserName: string };
};

export type MyPageStackParamList = {
  MyPageHome:        undefined;
  MyPosts:           undefined;
  MyComments:        undefined;
  MyPostDetail:      { postId: string };
  MyTradeDetail:     { postId: string };
};

export type NoticesStackParamList = {
  NoticeList:   undefined;
  NoticeDetail: { url: string; title: string };
};

export type MainTabParamList = {
  CommunityTab:   undefined;
  MarketplaceTab: undefined;
  ChatTab:        undefined;
  Laundry:        undefined;
  RoomWish:       undefined;
  NoticesTab:     undefined;
  MyPageTab:      undefined;
};

// ── 스택/탭 인스턴스 ──────────────────────────────────────────────────────────

const RootStack        = createNativeStackNavigator<RootStackParamList>();
const CommunityStack   = createNativeStackNavigator<CommunityStackParamList>();
const MarketplaceStack = createNativeStackNavigator<MarketplaceStackParamList>();
const ChatStack        = createNativeStackNavigator<ChatStackParamList>();
const MyPageStack      = createNativeStackNavigator<MyPageStackParamList>();
const NoticesStack     = createNativeStackNavigator<NoticesStackParamList>();
const MainTab          = createBottomTabNavigator<MainTabParamList>();

// ── 서브 네비게이터 ───────────────────────────────────────────────────────────

function CommunityNavigator() {
  return (
    <CommunityStack.Navigator>
      <CommunityStack.Screen name="CommunityHome" component={CommunityHomeScreen} options={{ title: '커뮤니티' }} />
      <CommunityStack.Screen name="PostList"      component={PostListScreen}      options={({ route }) => ({ title: route.params.title })} />
      <CommunityStack.Screen name="PostDetail"    component={PostDetailScreen}    options={{ title: '게시글' }} />
      <CommunityStack.Screen name="PostCreate"    component={PostCreateScreen}    options={{ title: '글 작성' }} />
    </CommunityStack.Navigator>
  );
}

function MarketplaceNavigator() {
  return (
    <MarketplaceStack.Navigator>
      <MarketplaceStack.Screen name="MarketplaceHome"   component={MarketplaceScreen}       options={{ title: '거래게시판' }} />
      <MarketplaceStack.Screen name="MarketplaceDetail" component={MarketplaceDetailScreen} options={{ title: '거래 상세' }} />
      <MarketplaceStack.Screen name="MarketplaceCreate" component={MarketplaceCreateScreen} options={{ title: '거래글 작성' }} />
    </MarketplaceStack.Navigator>
  );
}

function ChatNavigator() {
  return (
    <ChatStack.Navigator>
      <ChatStack.Screen name="ChatList" component={ChatListScreen} options={{ title: '채팅' }} />
      <ChatStack.Screen name="ChatRoom" component={ChatRoomScreen} options={({ route }) => ({ title: route.params.otherUserName })} />
    </ChatStack.Navigator>
  );
}

function NoticesNavigator() {
  return (
    <NoticesStack.Navigator>
      <NoticesStack.Screen name="NoticeList"   component={NoticesScreen}      options={{ title: '공지사항' }} />
      <NoticesStack.Screen name="NoticeDetail" component={NoticeDetailScreen} options={({ route }) => ({ title: route.params.title })} />
    </NoticesStack.Navigator>
  );
}

function MyPageNavigator() {
  return (
    <MyPageStack.Navigator>
      <MyPageStack.Screen name="MyPageHome"    component={MyPageScreen}           options={{ title: '마이페이지' }} />
      <MyPageStack.Screen name="MyPosts"       component={MyPostsScreen}          options={{ title: '내 게시글' }} />
      <MyPageStack.Screen name="MyComments"    component={MyCommentsScreen}       options={{ title: '내 댓글' }} />
      <MyPageStack.Screen name="MyPostDetail"  component={PostDetailScreen}       options={{ title: '게시글' }} />
      <MyPageStack.Screen name="MyTradeDetail" component={MarketplaceDetailScreen} options={{ title: '거래 상세' }} />
    </MyPageStack.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainTab.Navigator screenOptions={{ headerShown: false }}>
      <MainTab.Screen name="CommunityTab"   component={CommunityNavigator}   options={{ title: '커뮤니티' }} />
      <MainTab.Screen name="MarketplaceTab" component={MarketplaceNavigator} options={{ title: '거래' }} />
      <MainTab.Screen name="ChatTab"        component={ChatNavigator}        options={{ title: '채팅' }} />
      <MainTab.Screen name="Laundry"   component={LaundryScreen}    options={{ title: '세탁기',   headerShown: true }} />
      <MainTab.Screen name="RoomWish"  component={RoomWishScreen}   options={{ title: '방배정',   headerShown: true }} />
      <MainTab.Screen name="NoticesTab" component={NoticesNavigator} options={{ title: '공지사항' }} />
      <MainTab.Screen name="MyPageTab" component={MyPageNavigator}  options={{ title: '마이페이지' }} />
    </MainTab.Navigator>
  );
}

// ── 루트 ──────────────────────────────────────────────────────────────────────

function RootNavigator() {
  const { firebaseUser, appUser, isVerified, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!firebaseUser ? (
        <>
          <RootStack.Screen name="Login"    component={LoginScreen} />
          <RootStack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : !firebaseUser.emailVerified ? (
        <RootStack.Screen name="Verify" component={VerifyScreen} />
      ) : false && (!appUser || !isVerified) ? (
        <RootStack.Screen name="VerifyAcceptance" component={VerifyAcceptanceScreen} />
      ) : (
        <RootStack.Screen name="Main" component={MainNavigator} />
      )}
    </RootStack.Navigator>
  );
}

export default function Navigation() {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}
