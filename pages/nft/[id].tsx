import React, { useEffect, useState } from 'react'
import { GetServerSideProps } from 'next';
import toast,{Toaster} from 'react-hot-toast'
import {useAddress, useDisconnect, useMetamask, useContract} from '@thirdweb-dev/react'
import { sanityClient, urlFor } from '../../sanity';
import { Collection } from '../../typings';
import Link from 'next/link';
import { BigNumber } from 'ethers';


interface Props{
  collection:Collection
}

function NFTDropPage({collection}:Props) {

const [claimedSupply, setClaimedSupply] = useState<BigNumber>()
const [totalSupply, setTotalSupply] =useState<BigNumber>()
const[loading,setLoading] = useState<boolean>(true)
const[priceInEth,setPriceInEth] = useState<string>()
const {contract} = useContract(collection.address,'nft-drop')
  //Auth
  const connectWithMetamask = useMetamask();
  const address = useAddress();
  const disconnect = useDisconnect()

  useEffect(()=>{
     if(!contract) return

      const fetchNFTDropData = async()=>{
      setLoading(true)
      const claimed = await contract.totalClaimedSupply()
      const total = await contract.totalSupply()

      setClaimedSupply(claimed)
      setTotalSupply(total)
      setLoading(false)
     }
     fetchNFTDropData()
     console.log(Number(totalSupply))
  },[contract])

  useEffect(()=>{
    if(!contract)return
    
    const fetchNFTPrice = async()=>{
      const clalmeCondtions = await contract.claimConditions.getAll()
       setPriceInEth(clalmeCondtions?.[0].currencyMetadata.displayValue)

    }
    fetchNFTPrice()
  },[contract])

  const mintNFT=()=>{
      if(!contract || !address)return

      const quantity =1;
      setLoading(true)
      const notification = toast.loading('Minting...',{
        style:{
          background:'white',
          color:'green',
          fontWeight:'bolder',
          fontSize:'17px',
          padding:'20px'
        }
      })
      contract.claimTo(address,quantity).then((tx)=>{
         const receipt = tx[0].receipt
         toast('Minted successfuly!!!',{
          duration:8000,
          style:{
          background:'green',
          color:'white',
          fontWeight:'bolder',
          fontSize:'17px',
          padding:'20px'
          }

         })
      }).catch(err=>{
        console.log(err)
        toast('Something went wrong...',{
         style:{
          background:'red',
          color:'white',
          fontWeight:'bolder',
          fontSize:'17px',
          padding:'20px'
         }
        })
      }).finally(()=>{
        setLoading(false)
        toast.dismiss(notification)
      })
  }
  return (
    <div className='flex h-screen flex-col lg:grid lg:grid-cols-10'>
        <Toaster position='bottom-center'/>
        {/*Left*/}
      <div className='bg-gradient-to-br from-cyan-800
      to-rose-500 lg:col-span-4'>
        <div className='flex flex-col items-center 
        justify-center py-2 lg:min-h-screen'>
          <div className='bg-gradient-to-br from-yellow-400
        to-purple-600 p-2 rounded-xl'>
            <img className=' w-44 rounded-xl object-cover
            lg:h-96 lg:w-72' 
            src={urlFor(collection.previewImage).url()} />
          </div>
          <div className='text-center p-5 space-y-2'>
            <h1 className='text-4xl font-bold text-white'>
            {collection.nftCollectionName}
            </h1>
            <h2 className='text-xl text-gray-300'>
              {collection.description}
            </h2>
          </div>
          </div>
      </div>
      {/*Right*/}
      <div className='flex flex-1 flex-col p-12 lg:col-span-6' >
        {/*Header*/}
        <header className='flex items-center justify-between'>
          <Link href={'/'}>
          <h1 className='w-52 cursor-pointer text-xl 
          font-extralight sm:w-88'>
          The{' '}
          <span className='font-extrabold underline decoration-pink-600/50'>
          Blue wizard 
          </span>{' '}
          NFT mint marketplace
          </h1>
          </Link>
          <button className='rounded-full bg-rose-400 text-white
          px-4 py-2 text-xs lg:px-5 lg:py-3 lg:text-base'
          onClick={()=>address? disconnect():connectWithMetamask()}
          >
            {address ?'Sign out' :"Sign in"}
          </button>
        </header>
        <hr className='my-3 border'/>
        {address&&(
            <p className='font-sm text-center text-rose-600'>
              You are logged in with a wallet : {address.slice(0,4)}...{address.slice(-5)}
            </p>
        )}
          {/*Content*/}
          <div className='mt-10 flex flex-1 flex-col items-center 
          space-y-6 text-center lg:space-y-0 lg: justify-center'>
            <img className='w-80 object-cover pb-10 lg:h-40'
            src={urlFor(collection.mainImage).url()}
            alt=""/>
            <h1 className='text-3xl font-bold lg:text-5xl lg:font-extrabold'>
            {collection.title}
            </h1>
            {
              loading?(
              <p className=' animate-bounce pt-2 text-xl text-green-500'>
                 Loading supply data ...
              </p>
             
              ):( 
              <p className='pt-2 text-xl text-green-500'>
                {Number(claimedSupply)}/{Number(totalSupply)} NFT's clamed
              </p>
              )
            }
            {loading&&(
              <img className='h80 w-80 objectcontain'
              src='https://cdn.hackernoon.com/images/0*4Gzjgh9Y7Gu8KEtZ.gif'/>
            )}
           
          </div>
            {/*Mint Button */}
          <button className='h-16 w-full bg-red-600 text-white rounded-full mt-10 transition-all duration-200 
          hover:scale-105 disabled:bg-gray-400 disabled:scale-100'
          disabled={loading ||claimedSupply?.toNumber()==totalSupply?.toNumber|| !address} 
          onClick={mintNFT}
          >
            {loading ?(
              <>Loading price data</>
            ):claimedSupply?.toNumber()==totalSupply?.toNumber? (
              <>SOLD OUT</>
            ): !address?(
              <>Sign in to Mint</>
            ):(
              <span className='font-bold'>Mint NFT ({priceInEth} ETH) </span>
            )}
           
          </button>
      </div>
    </div>
  )
}

export default NFTDropPage

export const getServerSideProps:GetServerSideProps=async({params})=>{
const query=`  *[_type == "colllection" && slug.current==$id][0]{
  _id,
  title,
  address,
  description,
  nftCollection,
  mainImage{
    asset
  },
  previewImage{
    asset
  },
  slug{
    current
  },
  creator->{
    _id,
    name,
    address,
    slug{
      current
    },
  }
}`

const collection = await sanityClient.fetch(query,{
  id:params?.id
})

if(!collection){
  return{
    notFound:true
  }
}
 return{
  props:{
    collection
  }
 }
}
