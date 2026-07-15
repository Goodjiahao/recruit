package com.cauc.recruit.common;

import lombok.Data;

/**
 * 统一接口响应信封：{code, msg, data}
 * code=0 表示成功，非 0 表示失败。
 */
@Data
public class Result {

    private int code;
    private String msg;
    private Object data;

    public static Result ok(Object data) {
        Result r = new Result();
        r.code = 0;
        r.msg = "success";
        r.data = data;
        return r;
    }

    public static Result fail(String msg) {
        Result r = new Result();
        r.code = 1;
        r.msg = msg;
        return r;
    }
}
