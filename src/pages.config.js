/**
 * pages.config.js - Page routing configuration
 */

import AdivinaLaPalabra from './pages/AdivinaLaPalabra';
import AdivinaVersiculo from './pages/AdivinaVersiculo';
import AdivinaVersiculoDificil from './pages/AdivinaVersiculoDificil';
import AdivinaVersiculoPlay from './pages/AdivinaVersiculoPlay';
import AdminEscuchaYGana from './pages/AdminEscuchaYGana';
import AdminNotifications from './pages/AdminNotifications';
import AdminSaludos from './pages/AdminSaludos';
import AdminStats from './pages/AdminStats';
import AdminTrivia from './pages/AdminTrivia';
import AdminVideos from './pages/AdminVideos';
import Ahorcado from './pages/Ahorcado';
import AllPrograms from './pages/AllPrograms';
import AudioManager from './pages/AudioManager';
import Birthdays from './pages/Birthdays';
import Concurso from './pages/Concurso';
import ConflictsManager from './pages/ConflictsManager';
import EnviarSaludos from './pages/EnviarSaludos';
import EscuchaYGana from './pages/EscuchaYGana';
import EscuchaYGanaResultados from './pages/EscuchaYGanaResultados';
import Explore from './pages/Explore';
import Ganadores from './pages/Ganadores';
import Home from './pages/Home';
import Index from './pages/Index';
import JuegaYGana from './pages/JuegaYGana';
import Memorama from './pages/Memorama';
import Moderation from './pages/Moderation';
import MyAudios from './pages/MyAudios';
import NotificationCenter from './pages/NotificationCenter';
import NotificationSettings from './pages/NotificationSettings';
import Profile from './pages/Profile';
import PublicAudios from './pages/PublicAudios';
import QuienLoDijo from './pages/QuienLoDijo';
import Radio from './pages/Radio';
import RankingJuegos from './pages/RankingJuegos';
import Recommendations from './pages/Recommendations';
import RoleManagement from './pages/RoleManagement';
import Suggestions from './pages/Suggestions';
import TeamDesveladosRoom from './pages/TeamDesveladosRoom';
import TriviaBiblica from './pages/TriviaBiblica';
import Upload from './pages/Upload';
import Users from './pages/Users';
import VideoDetail from './pages/VideoDetail';
import Videos from './pages/Videos';
import __Layout from './Layout.jsx';

export const PAGES = {
    "AdivinaLaPalabra": AdivinaLaPalabra,
    "AdivinaVersiculo": AdivinaVersiculo,
    "AdivinaVersiculoDificil": AdivinaVersiculoDificil,
    "AdivinaVersiculoPlay": AdivinaVersiculoPlay,
    "AdminEscuchaYGana": AdminEscuchaYGana,
    "AdminNotifications": AdminNotifications,
    "AdminSaludos": AdminSaludos,
    "AdminStats": AdminStats,
    "AdminTrivia": AdminTrivia,
    "AdminVideos": AdminVideos,
    "Ahorcado": Ahorcado,
    "AllPrograms": AllPrograms,
    "AppStats": AdminStats,
    "AudioManager": AudioManager,
    "Birthdays": Birthdays,
    "Concurso": Concurso,
    "ConflictsManager": ConflictsManager,
    "EnviarSaludos": EnviarSaludos,
    "EscuchaYGana": EscuchaYGana,
    "EscuchaYGanaResultados": EscuchaYGanaResultados,
    "Explore": Explore,
    "Ganadores": Ganadores,
    "GoLive": GoLive,
    "Home": Home,
    "Index": Index,
    "JuegaYGana": JuegaYGana,
    "Memorama": Memorama,
    "Moderation": Moderation,
    "MyAudios": MyAudios,
    "NotificationCenter": NotificationCenter,
    "NotificationSettings": NotificationSettings,
    "Profile": Profile,
    "PublicAudios": PublicAudios,
    "QuienLoDijo": QuienLoDijo,
    "Radio": Radio,
    "RankingJuegos": RankingJuegos,
    "Recommendations": Recommendations,
    "RoleManagement": RoleManagement,
    "Suggestions": Suggestions,
    "TeamDesveladosRoom": TeamDesveladosRoom,
    "TriviaBiblica": TriviaBiblica,
    "Upload": Upload,
    "Users": Users,
    "VideoDetail": VideoDetail,
    "Videos": Videos,
};

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
