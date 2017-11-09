namespace java com.sankuai.sjst.erp.mcashier.api.thrift.service

include "c.thrift"
include "./a/a.thrift"

service BusinessSettingThriftService {

    /**
    * 查询设置
    **/
    BusinessSettingModel.QueryBusinessSettingResp getBusinessSetting(1:Common.UserContext userContext);

    /**
    * 更新设置
    **/
    Common.BooleanResp updateBusinessSetting(1:Common.UserContext userContext,
                            2:BusinessSettingModel.UpdateBusinessSettingReq req);
}

