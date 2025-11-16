# Features List and Page Structure

## Feature Classification

### 1. Installation Feature (Install)

#### 1.1 Installation Status Check
- **Purpose**: Check installation completion status on first access
- **Implementation**: Global middleware
- **Logic**:
  ```
  if (Setting.installed === false) {
    if (currentPath !== '/install') {
      redirect to '/install'
    }
  }
  ```

#### 1.2 Installation Page
- **Path**: `/install`
- **Features**:
  - Enter basic blog information
  - Create admin account
  - Create default categories
  - Complete installation process

### 2. Authentication Feature (Auth)

#### 2.1 Login
- **Path**: `/auth/login`
- **Features**:
  - Enter username/password
  - bcryptjs verification
  - Session creation

#### 2.2 Logout
- **Path**: `/auth/logout`
- **Features**:
  - Destroy session
  - Redirect to login page

#### 2.3 Session Validation
- **Implementation**: Middleware
- **Applied to**: All `/admin/*` paths

### 3. Blog Features (Public)

#### 3.1 Home/Post List
- **Path**: `/`
- **Features**:
  - Published posts list (pagination)
  - Sort by latest
  - Display thumbnails
  - Show publication date, category, tags

#### 3.2 Post Detail View
- **Path**: `/posts/:slug`
- **Features**:
  - Markdown → HTML rendering
  - Increment view count
  - Author information
  - Related posts recommendations

#### 3.3 View by Category
- **Path**: `/category/:slug`
- **Features**:
  - Posts list for specific category
  - Pagination

#### 3.4 View by Tag
- **Path**: `/tag/:slug`
- **Features**:
  - Posts list for specific tag
  - Pagination

#### 3.5 Search
- **Path**: `/search?q=keyword`
- **Features**:
  - Search in title/content
  - Results list

### 4. Admin Features

#### 4.1 Dashboard
- **Path**: `/admin`
- **Features**:
  - Statistics (post count, views, etc.)
  - Recent posts list
  - Quick action links

#### 4.2 Post Management

##### 4.2.1 Post List
- **Path**: `/admin/posts`
- **Features**:
  - All posts list (published/unpublished)
  - Search/filtering
  - Delete

##### 4.2.2 Create Post
- **Path**: `/admin/posts/new`
- **Features**:
  - Markdown editor
  - Real-time preview
  - Set title, slug, category, tags
  - Cover image upload
  - Publish/save as draft

##### 4.2.3 Edit Post
- **Path**: `/admin/posts/:id/edit`
- **Features**:
  - Edit existing post
  - Same features as create

#### 4.3 Category Management
- **Path**: `/admin/categories`
- **Features**:
  - Create/edit/delete categories
  - Adjust order

#### 4.4 Tag Management
- **Path**: `/admin/tags`
- **Features**:
  - Create/delete tags
  - Show usage count

#### 4.5 Settings
- **Path**: `/admin/settings`
- **Features**:
  - Edit basic blog information
  - Display settings
  - Edit account information

## Page Structure

### Public Pages

```
/                       → Home (post list)
/posts/:slug            → Post detail
/category/:slug         → Posts by category
/tag/:slug              → Posts by tag
/search                 → Search results
/about                  → About (existing)
```

### Admin Pages

```
/admin                  → Dashboard
/auth/login             → Login
/auth/logout            → Logout

/admin/posts            → Post list
/admin/posts/new        → Create post
/admin/posts/:id/edit   → Edit post

/admin/categories       → Category management
/admin/tags             → Tag management
/admin/settings         → Settings
```

### Installation Page

```
/install                → Installation page
```

## Screen Wireframes

### Home (Post List)
```
┌─────────────────────────────────────┐
│ [Logo] Blog Name          [Login]   │
├─────────────────────────────────────┤
│ [Home] [Category▼] [Tag▼] [Search🔍]│
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ [Thumbnail]                      │ │
│ │ Post Title                       │ │
│ │ Excerpt content...               │ │
│ │ Date | Category | Views 100      │ │
│ │ #tag1 #tag2                      │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ [Thumbnail]                      │ │
│ │ ...                              │ │
│ └─────────────────────────────────┘ │
│ [Prev] [1] [2] [3] [Next]           │
└─────────────────────────────────────┘
```

### Post Detail
```
┌─────────────────────────────────────┐
│ [Logo] Blog Name          [Login]   │
├─────────────────────────────────────┤
│ [← Back to List]                    │
├─────────────────────────────────────┤
│ Post Title                           │
│ Author | Date | Views | Category     │
│ #tag1 #tag2                          │
├─────────────────────────────────────┤
│ [Cover Image]                        │
├─────────────────────────────────────┤
│ Content (Markdown rendered)          │
│                                      │
│ ...                                  │
├─────────────────────────────────────┤
│ Related posts:                       │
│ - Post 1                             │
│ - Post 2                             │
└─────────────────────────────────────┘
```

### Admin Dashboard
```
┌─────────────────────────────────────┐
│ [Logo] Admin              [Logout]   │
├─────────────────────────────────────┤
│ [Dashboard] [Posts] [Categories] [Settings]│
├─────────────────────────────────────┤
│ Statistics                           │
│ ┌──────┐ ┌──────┐ ┌──────┐          │
│ │ Total│ │Publish│ │Views │          │
│ │  10  │ │   8  │ │ 523  │          │
│ └──────┘ └──────┘ └──────┘          │
├─────────────────────────────────────┤
│ Recent Posts                         │
│ - Post 1 (Published) [Edit] [Delete] │
│ - Post 2 (Draft) [Edit] [Delete]     │
├─────────────────────────────────────┤
│ Quick Actions                        │
│ [New Post] [Settings]                │
└─────────────────────────────────────┘
```

### Create/Edit Post
```
┌─────────────────────────────────────┐
│ [Logo] Admin              [Logout]   │
├─────────────────────────────────────┤
│ [← Back to List]                    │
├─────────────────────────────────────┤
│ Title: [___________________________] │
│ Slug: [___________________________] │
│ Category: [General ▼]                │
│ Tags: [tech, blog]                   │
│ Cover Image: [Choose File]           │
├─────────────────────────────────────┤
│ [Edit] [Preview]                     │
├─────────────────────────────────────┤
│ Markdown Editor                      │
│ ## Heading                           │
│ Content...                           │
│                                      │
├─────────────────────────────────────┤
│ [Save Draft] [Publish]               │
└─────────────────────────────────────┘
```

### Installation Page
```
┌─────────────────────────────────────┐
│         Numflow Blog Installation    │
├─────────────────────────────────────┤
│ 1. Blog Information                  │
│ Blog Name: [___________________]    │
│ Description: [_________________]    │
│                                      │
│ 2. Admin Account                     │
│ Username: [_____________________]   │
│ Email: [_______________________]    │
│ Password: [_____________________]   │
│ Confirm Password: [_____________]   │
│ Display Name: [________________]    │
│                                      │
│ [Install]                            │
└─────────────────────────────────────┘
```

## Priority

### Phase 1: Core Features
1. Installation system
2. Authentication system
3. Create/edit/delete posts
4. View post list/details

### Phase 2: Additional Features
1. Category/tag management
2. Search functionality
3. Dashboard statistics

### Phase 3: Advanced Features
1. Image upload
2. Markdown editor improvements
3. SEO optimization
4. RSS feed

## Next Steps

- Map each feature to Feature-First structure
- Detailed authentication/authorization system design
- Write implementation roadmap
