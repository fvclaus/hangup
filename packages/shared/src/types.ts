export type UnauthenticatedUserInfo = {
  authenticated: false;
  hasAcceptedPrivacyPolicy: false;
};

export type AuthenticatedUserInfo = {
  authenticated: true;
  id: string;
  name: string;
  picture: string;
  scopes: string;
  hasAcceptedPrivacyPolicy: true;
};

export type UserInfo = UnauthenticatedUserInfo | AuthenticatedUserInfo;

export interface Meeting {
  scheduledEndTime: string;
  name: string;
  userId: string;
  uri: string;
}

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type MeetingAndCode = Prettify<
  Meeting & {
    meetingCode: string;
  }
>;

export type User = {
  refresh_token: string;
};
