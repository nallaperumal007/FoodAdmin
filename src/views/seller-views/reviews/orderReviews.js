import React, { useContext, useEffect, useState } from 'react';
import { EyeOutlined } from '@ant-design/icons';
import { Button, Card, Rate, Space, Table } from 'antd';
import { toast } from 'react-toastify';
import CustomModal from '../../../components/modal';
import { Context } from '../../../context/context';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { disableRefetch, setMenuData } from '../../../redux/slices/menu';
import useDidUpdate from '../../../helpers/useDidUpdate';
import formatSortType from '../../../helpers/formatSortType';
import { useTranslation } from 'react-i18next';
import reviewService from '../../../services/seller/review';
import { sellerfetchOrderReviews } from '../../../redux/slices/orderReview';
import OrderReviewShowModal from './orderReviewShow';
import moment from 'moment';
import DeleteButton from '../../../components/delete-button';
import FilterColumns from '../../../components/filter-column';
import ResultModal from '../../../components/result-modal';
import userService from '../../../services/seller/user';
import { isArray } from 'lodash';
import SearchInput from '../../../components/search-input';
import { DebounceSelect } from '../../../components/search';

export default function SellerOrderReviews() {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [columns, setColumns] = useState([
    {
      title: t('order.id'),
      dataIndex: 'order',
      key: 'order',
      render: (order) => <div className='text-hover'>#{order.id}</div>,
      sorter: true,
      is_show: true,
    },
    {
      title: t('user'),
      dataIndex: 'user',
      key: 'user',
      is_show: true,
      render: (user) => (
        <div className='text-hover'>
          {user?.firstname} {user?.lastname || ''}
        </div>
      ),
    },
    {
      title: t('shop'),
      dataIndex: 'order',
      key: 'shop',
      is_show: true,
      render: (order) => (
        <div className='text-hover'>{order.shop?.translation?.title}</div>
      ),
    },
    {
      title: t('rating'),
      dataIndex: 'rating',
      key: 'rating',
      is_show: true,
      render: (rating) => <Rate disabled defaultValue={rating} />,
    },
    {
      title: t('created.at'),
      dataIndex: 'created_at',
      key: 'created_at',
      is_show: true,
      render: (createdAt) => moment(createdAt).format('DD.MM.YYYY'),
    },
    {
      title: t('options'),
      key: 'options',
      dataIndex: 'options',
      is_show: true,
      render: (data, row) => {
        return (
          <Space>
            <Button
              type='primary'
              icon={<EyeOutlined />}
              onClick={() => setShow(row.id)}
            />
            {/* <DeleteButton
              icon={<DeleteOutlined />}
              onClick={() => {
                setId([row.id]);
                setIsModalVisible(true);
                setText(true);
              }}
            /> */}
          </Space>
        );
      },
    },
  ]);

  const { setIsModalVisible } = useContext(Context);
  const [id, setId] = useState(null);
  const [show, setShow] = useState(null);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [text, setText] = useState(null);
  const [restore, setRestore] = useState(null);

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { reviews, meta, loading, params } = useSelector(
    (state) => state.orderReview,
    shallowEqual
  );
  const data = activeMenu.data;
  const paramsData = {
    search: data?.search ? data?.search : undefined,
    sort: data?.sort,
    column: data?.column,
    perPage: data?.perPage,
    page: data?.page,
    user_id: data?.user_id?.value,
  };

  const reviewDelete = () => {
    setLoadingBtn(true);
    const params = {
      ...Object.assign(
        {},
        ...id.map((item, index) => ({
          [`ids[${index}]`]: item,
        }))
      ),
    };
    reviewService
      .delete(params)
      .then(() => {
        toast.success(t('successfully.deleted'));
        dispatch(sellerfetchOrderReviews());
        setIsModalVisible(false);
      })
      .finally(() => setLoadingBtn(false));
  };

  const orderReviewDropAll = () => {
    setLoadingBtn(true);
    reviewService
      .dropAll()
      .then(() => {
        toast.success(t('successfully.deleted'));
        dispatch(sellerfetchOrderReviews());
        setRestore(null);
      })
      .finally(() => setLoadingBtn(false));
  };

  const orderReviewRestoreAll = () => {
    setLoadingBtn(true);
    reviewService
      .restoreAll()
      .then(() => {
        toast.success(t('successfully.restored'));
        dispatch(sellerfetchOrderReviews());
        setRestore(null);
      })
      .finally(() => setLoadingBtn(false));
  };

  useEffect(() => {
    if (activeMenu.refetch) {
      dispatch(sellerfetchOrderReviews());
      dispatch(disableRefetch(activeMenu));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMenu.refetch]);

  useDidUpdate(() => {
    dispatch(sellerfetchOrderReviews(paramsData));
  }, [activeMenu.data]);

  function onChangePagination(pagination, filters, sorter) {
    const { pageSize: perPage, current: page } = pagination;
    const { field: column, order } = sorter;
    const sort = formatSortType(order);
    dispatch(
      setMenuData({ activeMenu, data: { perPage, page, column, sort } })
    );
  }

  async function getUsers(search) {
    const params = {
      search,
      perPage: 10,
    };
    return userService.search(params).then(({ data }) => {
      return formatUser(data);
    });
  }

  function formatUser(data) {
    if (!data) return;
    if (isArray(data)) {
      return data.map((item) => ({
        label: `${item.firstname} ${item.lastname ? item.lastname : ''}`,
        value: item.id,
      }));
    } else {
      return {
        label: `${data.firstname} ${data.lastname}`,
        value: data.id,
      };
    }
  }

  const handleFilter = (items) => {
    const data = activeMenu.data;
    dispatch(
      setMenuData({
        activeMenu,
        data: { ...data, ...items },
      })
    );
  };

  const onSelectChange = (newSelectedRowKeys) => setId(newSelectedRowKeys);

  const rowSelection = {
    id,
    onChange: onSelectChange,
  };

  const allDelete = () => {
    if (id === null || id.length === 0) {
      toast.warning(t('select.the.product'));
    } else {
      setIsModalVisible(true);
      setText(false);
    }
  };

  return (
    <Card
      title={t('order.reviews')}
      extra={
        <Space wrap>
          <SearchInput
            placeholder={t('search')}
            handleChange={(e) => handleFilter({ search: e })}
            defaultValue={activeMenu.data?.search}
            resetSearch={!activeMenu.data?.search}
            allowClear={true}
            className='w-100'
          />
          <DebounceSelect
            style={{ width: '200px' }}
            debounceTimeout={500}
            placeholder={t('select.user')}
            onChange={(e) => handleFilter({ user_id: e })}
            fetchOptions={getUsers}
            allowClear={true}
          />
          <DeleteButton size='' onClick={allDelete}>
            {t('delete.selected')}
          </DeleteButton>
          <FilterColumns columns={columns} setColumns={setColumns} />
        </Space>
      }
    >
      <Table
        scroll={{ x: true }}
        rowSelection={rowSelection}
        columns={columns?.filter((item) => item.is_show)}
        dataSource={reviews}
        pagination={{
          pageSize: params.perPage,
          page: params.page,
          total: meta.total,
          defaultCurrent: params.page,
        }}
        rowKey={(record) => record.id}
        onChange={onChangePagination}
        loading={loading}
      />
      <CustomModal
        click={reviewDelete}
        text={text ? t('delete') : t('all.delete')}
        setText={setId}
        loading={loadingBtn}
      />
      {show && (
        <OrderReviewShowModal id={show} handleCancel={() => setShow(null)} />
      )}

      {restore && (
        <ResultModal
          open={restore}
          handleCancel={() => setRestore(null)}
          click={restore.restore ? orderReviewRestoreAll : orderReviewDropAll}
          text={restore.restore ? t('restore.modal.text') : t('read.carefully')}
          subTitle={restore.restore ? '' : t('confirm.deletion')}
          loading={loadingBtn}
          setText={setId}
        />
      )}
    </Card>
  );
}
