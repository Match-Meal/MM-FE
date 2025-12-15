import apiClient from './apiClient';

// --- Interfaces ---

export interface CommonResponse<T> {
  status: number;
  message: string;
  data: T;
}

export interface PostRequest {
  category: string; // 'NOTICE' | 'DIET' | 'INFO' | 'QNA' | 'FREE'
  title: string;
  content: string;
  deleteFileIds?: number[];
}

export interface PostFile {
  fileId: number;
  fileUrl: string;
  fileType: 'IMAGE' | 'VIDEO';
}

export interface PostUser {
  userId: number;
  userName: string;
  profileImage: string | null;
}

export interface Comment {
  commentId: number;
  content: string;
  user: PostUser | null; // 삭제된 댓글일 경우 null
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  isLiked: boolean;
  deleted?: boolean; // 삭제 여부
  children: Comment[]; // 대댓글 구조
}

export interface PostDetail {
  postId: number;
  category: string;
  title: string;
  content: string;
  viewCount: number;
  likeCount: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
  user: PostUser;
  images: PostFile[] | null;
  videos: PostFile[] | null;
  // files?: PostFile[]; // Backend now segregates by type in response objects
  comments: Comment[]; // 상세 조회 시 댓글 포함
  commentCount: number;
}

export interface PostListItem {
  postId: number;
  category: string;
  title: string;
  viewCount: number;
  likeCount: number;
  commentCount: number; // 목록 조회 시에도 댓글 수 필요할 수 있음
  createdAt: string;
  user: PostUser;
  thumbnailUrl?: string; // 목록용 썸네일 (Optional)
}

export interface PageInfo<T> {
  content: T[]; 
  pageInfo: {
    pageNo: number;        
    size: number;          
    numberOfElements: number; 
    totalCount: number;    
    totalPage: number;     
    hasNext: boolean;      
  };
}

export interface PostSearchParams {
  page?: number;     // 0-indexed
  size?: number;
  keyword?: string;
  searchType?: 'TITLE' | 'CONTENT' | 'TITLE_CONTENT' | 'WRITER';
  category?: string;
  sortType?: 'LATEST' | 'OLDEST' | 'VIEWS' | 'LIKES'; // Backend uses VIEWS, LIKES
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

export enum CommunityCategory {
  NOTICE = 'NOTICE',
  DIET = 'DIET',
  INFO = 'INFO',
  QNA = 'QNA',
  FREE = 'FREE',
}

// --- API Methods ---

// 1. 게시글 목록 조회
export const getPosts = async (params: PostSearchParams) => {
  const response = await apiClient.get<CommonResponse<PageInfo<PostDetail>>>('/community/posts', { params });
  return response.data.data;
};

// 2. 게시글 상세 조회
export const getPostDetail = async (postId: number) => {
  const response = await apiClient.get<CommonResponse<PostDetail>>(`/community/posts/${postId}`);
  return response.data.data;
};

// 3. 게시글 작성
export const createPost = async (postData: PostRequest, files?: File[]) => {
  const formData = new FormData();
  
  // JSON 데이터를 Blob으로 변환하여 추가 ('application/json')
  const jsonBlob = new Blob([JSON.stringify(postData)], { type: 'application/json' });
  formData.append('data', jsonBlob);

  // 파일 추가
  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append('file', file);
    });
  }

  const response = await apiClient.post<CommonResponse<number>>('/community/posts', formData, {
    headers: {
      'Content-Type': undefined, 
    },
  });
  return response.data;
};

// 4. 게시글 수정
export const updatePost = async (postId: number, postData: PostRequest, files?: File[]) => {
  const formData = new FormData();
  
  const jsonBlob = new Blob([JSON.stringify(postData)], { type: 'application/json' });
  formData.append('data', jsonBlob);

  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append('file', file);
    });
  }

  const response = await apiClient.put<CommonResponse<PostDetail>>(`/community/posts/${postId}`, formData, {
    headers: {
      'Content-Type': undefined,
    },
  });
  return response.data;
};

// 5. 게시글 삭제
export const deletePost = async (postId: number) => {
  const response = await apiClient.delete<CommonResponse<void>>(`/community/posts/${postId}`);
  return response.data;
};

// 6. 게시글 좋아요 토글
export const togglePostLike = async (postId: number) => {
  const response = await apiClient.post<CommonResponse<boolean>>(`/community/posts/${postId}/like`);
  return response.data.data; // true: liked, false: unliked
};

// --- Comment APIs ---

// 7. 댓글 작성 (parentCommentId는 대댓글일 경우 포함)
export const createComment = async (postId: number, content: string, parentCommentId?: number) => {
  const payload = { content, parentCommentId };
  const response = await apiClient.post<CommonResponse<Comment>>(`/community/posts/${postId}/comments`, payload);
  return response.data.data;
};

// 8. 댓글 수정
export const updateComment = async (commentId: number, content: string) => {
  const payload = { content };
  const response = await apiClient.put<CommonResponse<Comment>>(`/community/comments/${commentId}`, payload);
  return response.data.data;
};

// 9. 댓글 삭제
export const deleteComment = async (commentId: number) => {
  const response = await apiClient.delete<CommonResponse<void>>(`/community/comments/${commentId}`);
  return response.data;
};

// 10. 댓글 좋아요
export const toggleCommentLike = async (commentId: number) => {
  const response = await apiClient.post<CommonResponse<boolean>>(`/community/comments/${commentId}/like`);
  return response.data.data;
};
