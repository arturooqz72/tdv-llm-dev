/**
 * pages.config.js - Page routing configuration
 */

import AdivinaLaPalabra from './pages/AdivinaLaPalabra';
import AdivinaVersiculo from './pages/AdivinaVersiculo';
import AdivinaVersiculoDificil from './pages/AdivinaVersiculoDificil';
import AdivinaVersiculoPlay from './pages/AdivinaVersiculoPlay';
import AdminChatRooms from './pages/AdminChatRooms';
import AdminEscuchaYGana from './pages/AdminEscuchaYGana';
import AdminNotifications from './pages/AdminNotifications';
import AdminSaludos from './pages/AdminSaludos';
import AdminTrivia from './pages/AdminTrivia';
import AdminVideos from './pages/AdminVideos';
import Ahorcado from './pages/Ahorcado';
import AllPrograms from './pages/AllPrograms';
import AppStats from './pages/AppStats';
import AudioManager from './pages/AudioManager';
import Birthdays from './pages/Birthdays';
import Chat from './pages/Chat';
import Concurso from './pages/Concurso';
import ConflictsManager from './pages/ConflictsManager';
import EnviarSaludos from './pages/EnviarSaludos';
import EscuchaYGana from './pages/EscuchaYGana';
import EscuchaYGanaResultados from './pages/EscuchaYGanaResultados';
import Explore from './pages/Explore';
import Ganadores from './pages/Ganadores';
import GoLive from './pages/GoLive';
import GroupChat from './pages/GroupChat';
import Home from './pages/Home';
import Index from './pages/Index';
import JuegaYGana from './pages/JuegaYGana';
import LiveRadioPlayer from './pages/LiveRadioPlayer';
import LiveStream from './pages/LiveStream';
import LiveStreams from './pages/LiveStreams';
import Memorama from './pages/Memorama';
import Moderation from './pages/Moderation';
import MyAudios from './pages/MyAudios';
import NotificationCenter from './pages/NotificationCenter';
import NotificationSettings from './pages/NotificationSettings';
import Profile from './pages/Profile';
import PublicAudios from './pages/PublicAudios';
import QuienLoDijo from './pages/QuienLoDijo';
import Radio from './pages/Radio';
import RadioDashboard from './pages/RadioDashboard';
import RadioEvents from './pages/RadioEvents';
import RadioProgramDetail from './pages/RadioProgramDetail';
import RadioSchedule from './pages/RadioSchedule';
import RadioStats from './pages/RadioStats';
import RankingJuegos from './pages/RankingJuegos';
import Recommendations from './pages/Recommendations';
import RoleManagement from './pages/RoleManagement';
import StartLiveRadio from './pages/StartLiveRadio';
import Suggestions from './pages/Suggestions';
import TeamDesveladosRoom from './pages/TeamDesveladosRoom';
import TriviaBiblica from './pages/TriviaBiblica';
import Upload from './pages/Upload';
import UserProfile from './pages/UserProfile';
import Users from './pages/Users';
import VideoDetail from './pages/VideoDetail';
import Videos from './pages/Videos';
import __Layout from './Layout.jsx';

export const PAGES = {
    "AdivinaLaPalabra": AdivinaLaPalabra,
    "AdivinaVersiculo": AdivinaVersiculo,
    "AdivinaVersiculoDificil": AdivinaVersiculoDificil,
    "AdivinaVersiculoPlay": AdivinaVersiculoPlay,
    "AdminChatRooms": AdminChatRooms,
    "AdminEscuchaYGana": AdminEscuchaYGana,
    "AdminNotifications": AdminNotifications,
    "AdminSaludos": AdminSaludos,
    "AdminTrivia": AdminTrivia,
    "AdminVideos": AdminVideos,
    "Ahorcado": Ahorcado,
    "AllPrograms": AllPrograms,
    "AppStats": AppStats,
    "AudioManager": AudioManager,
    "Birthdays": Birthdays,
    "Chat": Chat,
    "Concurso": Concurso,
    "ConflictsManager": ConflictsManager,
    "EnviarSaludos": EnviarSaludos,
    "EscuchaYGana": EscuchaYGana,
    "EscuchaYGanaResultados": EscuchaYGanaResultados,
    "Explore": Explore,
    "Ganadores": Ganadores,
    "GoLive": GoLive,
    "GroupChat": GroupChat,
    "Home": Home,
    "Index": Index,
    "JuegaYGana": JuegaYGana,
    "LiveRadioPlayer": LiveRadioPlayer,
    "LiveStream": LiveStream,
    "LiveStreams": LiveStreams,
    "Memorama": Memorama,
    "Moderation": Moderation,
    "MyAudios": MyAudios,
    "NotificationCenter": NotificationCenter,
    "NotificationSettings": NotificationSettings,
    "Profile": Profile,
    "PublicAudios": PublicAudios,
    "QuienLoDijo": QuienLoDijo,
    "Radio": Radio,
    "RadioDashboard": RadioDashboard,
    "RadioEvents": RadioEvents,
    "RadioProgramDetail": RadioProgramDetail,
    "RadioSchedule": RadioSchedule,
    "RadioStats": RadioStats,
    "RankingJuegos": RankingJuegos,
    "Recommendations": Recommendations,
    "RoleManagement": RoleManagement,
    "StartLiveRadio": StartLiveRadio,
    "Suggestions": Suggestions,
    "TeamDesveladosRoom": TeamDesveladosRoom,
    "TriviaBiblica": TriviaBiblica,
    "Upload": Upload,
    "UserProfile": UserProfile,
    "Users": Users,
    "VideoDetail": VideoDetail,
    "Videos": Videos,
};

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
