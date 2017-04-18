struct TokenOpenidResp {
    1:required Status status;
    2:required string token; // token
    3:required string openid; // openid
}
struct GetUserInfoParam{
    1:required string token;//
    2:required string openid;//
}

enum Gender {
  UNKONWN = 0;
  MALE = 1;
  FEMALE= 2;
}

struct WeichatUserInfo{
    1:required string openid;
    2:required string unionid;
    3:optional string headimgurl; 
    4:optional string nickname; 
    5:optional string remark;
    6:optional Gender gender;
}

struct WeichatUserInfoResp {
    1:required Status status;
    2:required WeichatUserInfo userinfo;
}

struct GetNewTokenResp {
    1:required Status status;
    2:required string token;
}

service OrderAccessThriftService {
     TokenOpenidResp getTokenOpenid(1:required string code);
     WeichatUserInfoResp getWeichatUserInfo(1:required Model.GetUserInfoParam userInfoParam);
     GetNewTokenResp getNewToken(1:required string token);
}
struct Status{
	1:required i32 code;
	2:optional string msg;
}