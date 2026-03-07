import React, { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const VIDEO_LIKES_STORAGE_KEY = "tdv_video_likes";

const religionColors = {
  lldm: "from-cyan-500 to-cyan-400",
  cristianismo: "from-blue-500 to-blue-600",
  islam: "from-green-500 to-green-600",
  judaismo: "from-indigo-500 to-indigo-600",
  budismo: "from-orange-500 to-orange-600",
  hinduismo: "from-purple-500 to-purple-600",
  espiritualidad: "from-pink-500 to-pink-600",
  ateismo: "from-gray-500 to-gray-600",
  agnosticismo: "from-slate-500 to-slate-600",
  otra: "from-teal-500 to-teal-600",
};

function readStoredLikes() {
  try {
    const raw = localStorage.getItem(VIDEO_LIKES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredLikes(likes) {
  localStorage.setItem(VIDEO_LIKES_STORAGE_KEY, JSON.stringify(likes));
}

export default function VideoCard({ video, currentUser, onLikeUpdate }) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(video.likes_count || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    if (!video?.id || !currentUser?.email) {
      setLiked(false);
      return;
    }

    const likes = readStoredLikes();
    const alreadyLiked = likes.some(
      (item) =>
        String(item.video_id) === String(video.id) &&
        item.user_email === currentUser.email
    );

    setLiked(alreadyLiked);
    setLikesCount(
      likes.filter((item) => String(item.video_id) === String(video.id)).length ||
        video.likes_count ||
        0
    );
  }, [video?.id, video?.likes_count, currentUser?.email]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1, rootMargin: "50px" }
    );

    const current = cardRef.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, []);

  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser?.email || isLiking || !video?.id) return;

    setIsLiking(true);

    try {
      const likes = readStoredLikes();

      if (liked) {
        const updatedLikes = likes.filter(
          (item) =>
            !(
              String(item.video_id) === String(video.id) &&
              item.user_email === currentUser.email
            )
        );

        saveStoredLikes(updatedLikes);
        setLikesCount(
          updatedLikes.filter((item) => String(item.video_id) === String(video.id))
            .length
        );
        setLiked(false);
      } else {
        const newLike = {
          id: crypto.randomUUID(),
          video_id: video.id,
          user_email: currentUser.email,
          created_date: new Date().toISOString(),
        };

        const updatedLikes = [...likes, newLike];
        saveStoredLikes(updatedLikes);
        setLikesCount(
          updatedLikes.filter((item) => String(item.video_id) === String(video.id))
            .length
        );
        setLiked(true);
      }

      if (onLikeUpdate) onLikeUpdate();
    } catch (error) {
      console.error("Error al dar like:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const authorName =
    video.created_by?.split("@")[0] || video.userName || video.author || "Usuario";

  const authorInitial = authorName?.charAt(0)?.toUpperCase() || "U";

  return (
    <Link to={createPageUrl(`VideoDetail?id=${video.id}`)}>
      <div
        ref={cardRef}
        className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100"
      >
        <div className="relative aspect-[9/16] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
          {video.thumbnail_url ? (
            <img
              src={video.thumbnail_url}
              alt={video.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              style={{ display: isVisible ? "block" : "none" }}
            />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-br ${
                religionColors[video.religion] || "from-gray-400 to-gray-500"
              } flex items-center justify-center`}
            >
              <span className="text-white text-6xl font-light">✊</span>
            </div>
          )}

          {video.religion && (
            <div className="absolute top-4 left-4">
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-medium text-white bg-gradient-to-r ${
                  religionColors[video.religion] || "from-gray-400 to-gray-500"
                } backdrop-blur-sm shadow-lg`}
              >
                {video.religion}
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>

        <div className="p-5">
          <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
            {video.title}
          </h3>

          {video.description && (
            <p className="text-gray-600 text-sm line-clamp-2 mb-4">
              {video.description}
            </p>
          )}

          <div className="flex items-center gap-5 text-sm text-gray-500">
            <button
              onClick={handleLike}
              className={cn(
                "flex items-center gap-1.5 transition-all hover:scale-110",
                liked && "text-red-500"
              )}
              disabled={isLiking}
            >
              <Heart className={cn("w-4 h-4", liked && "fill-current")} />
              <span className="font-medium">{likesCount}</span>
            </button>

            <div className="flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4" />
              <span className="font-medium">{video.comments_count || 0}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              <span className="font-medium">{video.views_count || 0}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-medium">
              {authorInitial}
            </div>
            <span className="text-sm text-gray-700 font-medium">
              {authorName}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
