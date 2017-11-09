namespace java com.sankuai.sjst.erp.mcashier.api.thrift.model.setting

include "../c.thrift"

//状态含义 1.不开启 2.开启
struct PrintConfigTO {
    1:optional i32 payedReceipt; //付款
    2:optional i32 refundedReceipt; //退款小票
    3:optional i32 orderedReceipt; //下单小票
}

struct BusinessSettingTO {
    1:optional string logo; //门店logo
    2:optional i32 oddmentType; //抹零 1:不处理, 2:抹分, 3:抹角, 4:四舍五入
    3:optional i32 payedVoice; //收款提示音 1:不开启, 2:叮咚, 3:人声提示收款, 4:人声提示收款金额
    4:optional i32 openTime; //开门时间
    5:optional i32 closeTime;//关门时间
    6:optional PrintConfigTO printConfig; //打印机配置
}

struct QueryBusinessSettingReq {
    1:required Common.UserContext userContext;
}

struct UpdateBusinessSettingReq {
    1:required BusinessSettingTO businessSetting;
}

struct QueryBusinessSettingResp {
    1:required Common.Status status;
    2:optional BusinessSettingTO businessSetting;
}
