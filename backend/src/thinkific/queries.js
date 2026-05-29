export const COURSES_QUERY = `
  query Site($first: Int, $after: String) {
    site {
      courses(first: $first, after: $after) {
        nodes {
          id
          name
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

export const LESSONS_QUERY = `
  query Course($courseID: ID!, $chaptersFirst: Int!, $lessonsFirst: Int!) {
    course(id: $courseID) {
      id
      description
      name
      slug
      title
      curriculum {
        chapters(first: $chaptersFirst) {
          nodes {
            id
            lessons(first: $lessonsFirst) {
              pageInfo {
                hasNextPage
                hasPreviousPage
                startCursor
                endCursor
              }
              nodes {
                id
                lessonType
              }
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
        }
      }
    }
  }
`;

export const CAPTIONS_QUERY = `
  query Lesson($lessonID: ID!) {
    lesson(id: $lessonID) {
      draft
      id
      lessonType
      takeUrl
      title
      content {
        ... on VideoContent {
          contentType
          createdAt
          durationInSeconds
          fileName
          fileSize
          fileType
          htmlDescription
          id
          playUrl
          thumbnail
          updatedAt
          url
          videoId
          captions {
            content
            downloadUrl
            languageCode
            languageLabel
          }
        }
      }
    }
  }
`;
