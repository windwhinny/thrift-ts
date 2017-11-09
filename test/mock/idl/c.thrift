namespace java com.sankuai.sjst.erp.mcashier.api.thrift.model.common

/** 通用Model类定义 **/

/**
 * 登录用户上下文
 **/
struct UserContext {

  /**
   * 租户ID
   **/
  1:required i32 tenantId;

  /**
   * 门店ID
   **/
  2:required i32 poiId;

  /**
   * 账户ID
   **/
  3:required i32 accId;

}

/**
 * 租户上下文(不带accId)
 **/
struct TenantContext {

  /**
   * 租户ID
   **/
  1:required i32 tenantId;

  /**
   * 门店ID
   **/
  2:required i32 poiId;
}

/**
 * RPC响应状态
 **/
struct Status {

  /**
   * 响应码, 0为正常
   **/
  1:required i32 code;

  /**
   * 消息
   **/
  2:optional string msg;
}

/**
* 分页详情
**/
struct Page {
    /**
    * 页码
    **/
    1:optional i32 pageNo;
    /**
    * 每页数量
    **/
    2:optional i32 pageSize;
    /**
    * 总数量
    **/
    3:optional i32 totalCount;
    /**
    * 总页数
    **/
    4:optional i32 totalPageCount;
}

struct BooleanResp {
    1:required Status status;
    2:optional bool success;
}

struct VoidResp {
    1: required Status status;
}
