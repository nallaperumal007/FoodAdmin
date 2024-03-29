import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Button, Col, Form, Input, InputNumber, Modal, Row } from 'antd';
import { shallowEqual, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import bookingService from 'services/booking-zone';
import MediaUpload from 'components/upload';

const BookingZoneAddModal = ({ visible, handleCancel }) => {
  const { t } = useTranslation();
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const [form] = Form.useForm();
  const { myShop } = useSelector((state) => state.myShop, shallowEqual);
  const [image, setImage] = useState(
    activeMenu.data?.image ? [activeMenu.data?.image] : []
  );
  const { defaultLang, languages } = useSelector(
    (state) => state.formLang,
    shallowEqual
  );
  const [loadingBtn, setLoadingBtn] = useState(false);

  const onFinish = (values) => {
    const body = {
      ...values,
      area: String(values.area),
      images: image?.map((img) => img.name),
      shop_id: myShop.id,
    };
    setLoadingBtn(true);
    bookingService
      .create(body)
      .then(() => {
        toast.success(t('successfully.created'));
        handleCancel();
      })
      .finally(() => setLoadingBtn(false));
  };

  return (
    <Modal
      title={t('add.booking.zone')}
      visible={visible}
      onCancel={handleCancel}
      footer={[
        <Button
          key='ok-button'
          type='primary'
          onClick={() => form.submit()}
          loading={loadingBtn}
          className='table_booking'
        >
          {t('confirm')}
        </Button>,
      ]}
    >
      <Form
        name='basic'
        layout='vertical'
        onFinish={onFinish}
        form={form}
        initialValues={{ active: true, ...activeMenu.data }}
      >
        <Row gutter={12}>
          <Col span={12}>
            {languages.map((item) => (
              <Form.Item
                key={'title' + item.id}
                label={t('title')}
                name={['title', item.locale]}
                rules={[
                  {
                    required: item.locale === defaultLang,
                    message: t('required'),
                  },
                ]}
                hidden={item.locale !== defaultLang}
              >
                <Input />
              </Form.Item>
            ))}
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('area')}
              name='area'
              rules={[
                { required: true, message: t('required') },
                {
                  validator(_, value) {
                    if (value < 1) {
                      return Promise.reject(new Error(t('must.be.at.least.1')));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber className='w-100' />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label={t('image')}>
              <MediaUpload
                type='shop-galleries'
                imageList={image}
                setImageList={setImage}
                form={form}
                multiple={true}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default BookingZoneAddModal;
